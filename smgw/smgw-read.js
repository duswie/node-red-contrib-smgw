
module.exports = function(RED) {


    function SmgwReadNode(config) {
        
        RED.nodes.createNode(this,config);
        var node = this;
  
        this.smgw = RED.nodes.getNode(config.smgw);
        this.status({fill:"red",shape:"ring",text:"disconnected"});
        this.status({fill:"yellow",shape:"ring",text:"connecting..."});
        /*  ensure an update interval > 1 minute to prevent DDoS, set default to 15 Minutes */
        var updateInterval = 15;
        if(config.interval >= 1 && !isNaN(config.interval)){
            updateInterval = config.interval;
        }

        var loadValue = () => {
            this.HanAdapter.readCounter(config.meterid).then((meter_data)=>{
                this.status({fill:"green",shape:"dot",text:meter_data.value + " "+ meter_data.unit});
                var msg = {};
                msg.payload = meter_data;
                node.send(msg);
            }).catch((err) => {
                this.status({fill:"red",shape:"dot",text:"Error"});
                this.error(err);
            });
        }
            

        if (this.smgw) {
            let adapterpah = './han-adapter/' + this.smgw.model
            this.log('Import HAN adapter for ' + this.smgw.model + 'from ' + adapterpah);
            const HanAdapter = require(adapterpah);
            this.HanAdapter = new HanAdapter(this.smgw);
            //Connection test 
            /*
            this.HanAdapter.testConnection().then(()=>{
                this.log('Connection to Smart Meter Gateway established');               
            }).catch(()=>{
                this.error('Connection to Smart Meter Gateway failed');
            })
            */
            
            loadValue();
            const intervalTimer = setInterval(loadValue, updateInterval*60*1000);

            this.on('close', () => {
                clearInterval(intervalTimer);
            });


          
        } else {
            this.warn('No Smart Meter Model selected');
        }


    }
    RED.nodes.registerType("smgw-read",SmgwReadNode);
}