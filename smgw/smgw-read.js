
module.exports = function (RED) {


    function SmgwReadNode(config) {

        RED.nodes.createNode(this, config);
        var node = this;

        this.smgw = RED.nodes.getNode(config.smgw);
        this.status({ fill: "red", shape: "ring", text: "disconnected" });
        this.status({ fill: "yellow", shape: "ring", text: "connecting..." });

        /*  ensure an update interval > 1 minute to prevent DDoS, set default to 15 Minutes */
        var updateInterval = 15;
        if (config.interval >= 1 && !isNaN(config.interval)) {
            updateInterval = config.interval;
        }

        var loadValue = () => {
            this.HanAdapter.readMeter(config.meterid).then((meter_data) => {
                try {
                    var msg = {
                        payload: meter_data.value,
                        time: Date.parse(meter_data.timestamp + ' GMT+0200'), //TODO: Make timezone user changeable
                        unit: meter_data.unit,
                        isvalid: Boolean(meter_data.isvalid),
                        time_raw: meter_data.timestamp,
                        meterid: meter_data.meterid,
                        updateinterval: meter_data.updateinterval,
                        gwfirmware: meter_data.fwversion,
                        obis: meter_data.obis

                    };
                } catch (e) {
                    this.status({ fill: "red", shape: "dot", text: "Error" });
                    this.error('Data conversion error:' + e.message);
                }

                this.status({ fill: "green", shape: "dot", text: meter_data.value + " " + meter_data.unit });
                node.send(msg);
            }).catch((err) => {
                this.status({ fill: "red", shape: "dot", text: "Error" });
                this.error(err);
            });
        }


        if (this.smgw) {

            /*load the HAN adapter */
            let adapterpah = './han-adapter/' + this.smgw.model
            this.log('Import HAN adapter for ' + this.smgw.model + 'from ' + adapterpah);
            const HanAdapter = require(adapterpah);
            this.HanAdapter = new HanAdapter(this.smgw);

            loadValue();
            const intervalTimer = setInterval(loadValue, updateInterval * 60 * 1000);

            this.on('close', () => {
                clearInterval(intervalTimer);
            });



        } else {
            this.warn('No Smart Meter Model selected');
        }


    }
    RED.nodes.registerType("smgw-read", SmgwReadNode);
}