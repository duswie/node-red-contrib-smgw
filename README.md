# node-red-contrib-smgw
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/dadley/node-red-contrib-smgw)
[![npm version](https://badge.fury.io/js/node-red-contrib-smgw.svg)](https://badge.fury.io/js/node-red-contrib-smgw)

A Node-RED node to read data from Smart Meter Gateways (SMGWs) via the HAN interface. 

## Supported Smart Meter Gateways
Due to a non-standardised interface over the HAN connection, adaptation is necessary for each gateway manufacturer. Currently only the following gateways are supported:
- PPC Smart Meter Gateway (tested with FW 31416-31435)

## Getting started
Use 'Manage Palette' in the Node RED Webinterface or install via cli: 

```
$ cd ~/.node-red
$ npm install node-red-contrib-smgw
```

### Gateway credentials/ip and default ip
**Westnetz:** 
- PPC Smart Meter Gateway with default ip 192.168.1.200
- Password editable on https://medaco.westnetz.de/web2_wn/sethanpassword
- Username is the last part of the HAN-Profile field (e.g. 921908|ECPR0000064191| **6149436**). In this example 6149436 is the username.

- HAN Webinterface on https://192.168.1.200/cgi-bin/hanservice.cgi


### smgw-read node
With the help of the node 'smgw-read', meter readings can be read via a gateway. The following example message is returned:
```json
{
    "payload":1061.9932,
    "time":1622041200000,
    "unit":"kWh",
    "isvalid":true,
    "time_raw":"2021-05-26 17:00:00",
    "meterid":"1itr0015451709.sm",
    "updateinterval":900,
    "gwfirmware":"31416-31435",
    "obis":"1-0:1.8.0",
}
```

## Flow Examples

### Log meter value with influx
Sending meter value with timestamp to influx database.
![Screenshot Influx smart meter gateway example](https://github.com/dadley/node-red-contrib-smgw/blob/main/docs/images/influx-smart-meter-example.png?raw=true)
```
[{"id":"5dcd50ec.d6a738","type":"influxdb out","z":"e30de6ff.bf75c","influxdb":"1264afb5.fabe2","name":"","measurement":"P001_grid_electricity_meter","precision":"ms","retentionPolicy":"","x":756,"y":148,"wires":[]},{"id":"a68b7d66.a65e68","type":"change","z":"e30de6ff.bf75c","name":"format for influx","rules":[{"t":"move","p":"payload","pt":"msg","to":"payload.value","tot":"msg"},{"t":"move","p":"time","pt":"msg","to":"payload.time","tot":"msg"},{"t":"move","p":"isvalid","pt":"msg","to":"payload.isvalid","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":424,"y":148,"wires":[["5dcd50ec.d6a738"]]},{"id":"c42db596.e8992","type":"smgw-read","z":"e30de6ff.bf75c","name":"Zähler Netz","smgw":"8c0360b0.6e64b","meterid":"1itr0034452109","interval":"2","x":255,"y":148,"wires":[["a68b7d66.a65e68"]]},{"id":"1264afb5.fabe2","type":"influxdb","z":"","hostname":"192.168.178.10","port":"8080","protocol":"http","database":"exampledb","name":"","usetls":false,"tls":""},{"id":"8c0360b0.6e64b","type":"smart-meter-gateway","z":"","ip":"192.168.1.200","model":"ppc"}]
```

## Contribution
Thank you for considering contributing to this project! Feel free to report bugs or submit pull requests. 
It would be great to support more than one gateway manufacturer in the future. Through a modular design, adapters for additional gateways can be easily added.  If you are interested please contact me for assistance.