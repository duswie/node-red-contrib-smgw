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
$ npm install node-red-contrib-chatbot
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

## Contribution
Thank you for considering contributing to this project! Feel free to report bugs or submit pull requests. 
It would be great to support more than one gateway manufacturer in the future. Through a modular design, adapters for additional gateways can be easily added.  If you are interested please contact me for assistance.