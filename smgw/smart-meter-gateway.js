module.exports = function(RED) {
    function SmgwNode(n) {
        RED.nodes.createNode(this,n);
        this.ip = n.ip;
        this.model = n.model;
    }
    RED.nodes.registerType("smart-meter-gateway",SmgwNode, {
        credentials: {
            username: {type:"text"},
            password: {type:"password"}
         }
    });
}