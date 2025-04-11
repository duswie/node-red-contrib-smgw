class ExampleHanAdapter {
    constructor(config) {
        this.config = config
    }


    readMeter(meter_id) {
        return new Promise((resolve, reject) => {

            /* auth to the GW */
            if (this.config.ip != "192.168.1.200")
                reject('Connection Error');
            if (this.config.credentials.username != "testuser")
                reject('Auth Error');
            if (this.config.credentials.password != "password")
                reject('Auth Error');


            /*get the date form the gateway, Example response: */
            const meter_data = {
                'value': 123.2,
                'unit': 'kWh',
                'timestamp': "2021-05-26 17:00:00",
                'isvalid': true,
                'name': 'Wirkleistung',
                'obis': "1-0:1.8.0",
                'fwversion': "31416-31435",
                'meterid': "1itr0035459107.sm",
                'updateinterval': 900
            };

            /* resolve Promise with meter data */
            resolve(meter_data);

        })
    }


}

module.exports = ExampleHanAdapter;
