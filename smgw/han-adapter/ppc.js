const { parse } = require('node-html-parser');
const { rejects } = require('assert');
const { Console } = require('console');

let crypto = require('crypto');

/* shortcut to md5 hash function */
var md5 = (data) => {
    let md5 = crypto.createHash('md5');
    let result = md5.update(data).digest('hex');

    return result;
}


/* simple http digest auth implementation with support for nc counter, might be useful for other Smart Meter Gateways */
class DigestClient {
    constructor(options, username, password, https) {
        this.username = username;
        this.password = password;
        this.options = options;
        this.options.headers = {};
        if (https) {
            this.http = require('https');
        } else {
            this.http = require('http');
        }

        this.nc = 1;
        this.cnonce = md5(String(new Date().getTime()));
        this.realm = null;
    }



    /* int to string with leading zeros */
    pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }

    /*parses the relevant digest auth data form incoming html header */
    parseDigestHeader(auth_header) {
        let parts = auth_header.split(",");
        for (let item of parts) {
            if (item.indexOf("realm=") >= 0) {
                let realmSplit = item.split("=\"");
                this.realm = realmSplit[realmSplit.length - 1];
                this.realm = this.realm.substring(0, this.realm.length - 1);
            }

            if (item.indexOf("nonce=") >= 0) {
                let nonceSplit = item.split("=\"");
                this.nonce = nonceSplit[nonceSplit.length - 1];
                this.nonce = this.nonce.substring(0, this.nonce.length - 1);
            }

            if (item.indexOf("qop=") >= 0) {
                let qopSplit = item.split("=\"");
                this.qop = qopSplit[qopSplit.length - 1];
                this.qop = this.qop.substring(0, this.qop.length - 1);
            }
            if (item.indexOf("opaque=") >= 0) {
                let opaqueSplit = item.split("=\"");
                this.opaque = opaqueSplit[opaqueSplit.length - 1];
                this.opaque = this.opaque.substring(0, this.opaque.length - 1);
            }
        }
    }

    /* generate a valid digest auth header for outgoing requests   */
    getAuthHeader() {
        let HA1 = md5(this.username + ":" + this.realm + ":" + this.password);
        let HA2 = md5(this.options.method + ":" + this.options.path);
        let response = md5(HA1 + ":" + this.nonce + ":" + this.pad(this.nc, 8) + ":" + this.cnonce + ":" + this.qop + ":" + HA2);
        return "Digest username=\"" + this.username + "\",realm=\"" + this.realm + "\",nonce=\"" + this.nonce + "\",uri=\"" + this.options.path + "\",cnonce=\"" + this.cnonce + "\",nc=" + this.pad(this.nc, 8) + ",algorithm=MD5,response=\"" + response + "\",qop=\"" + this.qop + "\"";
    }

    /* get the auth header for following requests */
    auth(path) {
        if (path) {
            this.options.path = path;
        }

        return new Promise((resolve, reject) => {
            this.http.request(this.options, (res) => {
                //console.log('statusCode:', res.statusCode);
                //console.log('headers:', res.headers);
                if (res.statusCode != 401) {
                    reject('No Auth needed, StatusCode: ' + res.statusCode);
                }
                if (!res.headers['www-authenticate'].startsWith('Digest')) {
                    reject('No Digest Auth request');
                }
                this.parseDigestHeader(res.headers['www-authenticate']);

                resolve();
            })
                .on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject('Connection Error');
                })
                .end();
        });
    }

    request(method, body) {
        this.options.method = method || 'GET';

        this.options.headers['Authorization'] = this.getAuthHeader();
        if (body) {
            this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            this.options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        return new Promise((resolve, reject) => {
            var req = this.http.request(this.options, (res) => {
                //console.log('statusCode:', res.statusCode);
                //console.log('headers:', res.headers);
                var body = '';
                this.nc++;
                res.on('data', (d) => {
                    body += d;
                });
                res.on('end', () => {
                    resolve({
                        meta: res,
                        body: body
                    });
                });
            })
                .on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject(e.message);
                });
            if (body)
                req.write(body);
            req.end();



        });

    }

}

class PpcHanAdapter {
    constructor(config) {
        this.config = config
        this.options = {
            hostname: this.config.ip,
            port: 443,
            path: '/cgi-bin/hanservice.cgi',
            method: 'GET',
            rejectUnauthorized: false, //do not check ssl cert
        };
    }


    /* Init a new DiggestClient to communicate with the gateway */
    client() {
        return new DigestClient(this.options, this.config.credentials.username, this.config.credentials.password, true);
    }

    testConnection() {
        console.log('connection test (ppc) start');

        var client = this.client();

        return new Promise((resolve, reject) => {
            client.auth("/cgi-bin/hanservice.cgi").then(() => {
                client.request().then((res) => {
                    if (res.meta.statusCode == 200 && res.body.indexOf('Willkommen') >= 0) {
                        resolve('Success');
                    } else {
                        reject('Auth failed!');
                    }
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }


    readMeter(meter_id) {

        var client = this.client();

        return new Promise((resolve, reject) => {
            /* digest auth to the gateway */
            client.auth("/cgi-bin/hanservice.cgi")
                .then(() => {
                    /* get welcome page with a simple GET request */
                    return client.request();
                })
                .then((res) => {
                    /*check if error page */
                    if (res.body.indexOf('Fehler') >= 0) {
                        reject('Auth Error');
                    }

                    /*get and save the session cookie, has to be send with any request */
                    client.options.headers['Cookie'] = res.meta.headers['set-cookie'][0].split(';')[0];

                    /* parse the received html */
                    var doc = parse(res.body);

                    /* navigate to Zähler page with POST request */
                    var tkn = doc.querySelector('#button_menu_zaehler').parentNode.querySelector('input[name="tkn"]').getAttribute('value'); //looks like a CSRF-Token
                    var action = doc.querySelector('#button_menu_zaehler').parentNode.querySelector('input[name="action"]').getAttribute('value');
                    var post_body = "tkn=" + tkn + "&action=" + action;
                    return client.request('POST', post_body);

                })
                .then((res) => {
                    /* parse the received html */
                    var doc = parse(res.body);

                    /* get the requested meterid form the select input on the page, select value (mid) changes on every request */
                    var meter_select = doc.querySelector('#meterform_select_meter');
                    var mid = null;
                    var meter_list = '';
                    for (let meter of meter_select.childNodes) {
                        /* find the requested meter in select options */
                        meter_list += meter.text + ", ";
                        if (meter.text.indexOf(meter_id) >= 0) {
                            mid = meter.getAttribute('value');
                        }
                    }

                    /* if the requested meter is not found */
                    if (!mid) {
                        console.log("meter " + meter_id + " not found! Available meters: " + meter_list);
                        reject('Meter with id ' + meter_id + ' not found! ' + "Available meters: " + meter_list);
                    }

                    /* click "Zählerprofil" Button */
                    var tkn = doc.querySelector('#form_meterform').querySelector('input[name="tkn"]').getAttribute('value'); //looks like a CSRF-Token
                    var post_body = "tkn=" + tkn + "&action=showMeterProfile&mid=" + mid;
                    return client.request('POST', post_body);

                })
                .then((res) => {
                    /* parse the received html */
                    var doc = parse(res.body);
    
                    /* we're now on the page with the meter values, lets extract them*/
                    var meta_table_tds = doc.querySelectorAll('.content > table:nth-of-type(2) > tr > td:nth-of-type(2)');
                    const meter_data = {
                        'value': parseFloat(doc.querySelector('#table_metervalues_col_wert').text),
                        'unit': doc.querySelector('#table_metervalues_col_einheit').text,
                        'timestamp': doc.querySelector('#table_metervalues_col_timestamp').text,
                        'isvalid': doc.querySelector('#table_metervalues_col_istvalide').text,
                        'name': doc.querySelector('#table_metervalues_col_name').text,
                        'obis': doc.querySelector('#table_metervalues_col_obis').text,
                        'fwversion': doc.querySelector('#div_fwversion').text,
                        'meterid': meta_table_tds[0].text,
                        'updateinterval': parseInt(meta_table_tds[6].text)
                    };

                    resolve(meter_data);
                }).catch((err) => {
                    reject(err);
                });
        });
    }
}

module.exports = PpcHanAdapter;