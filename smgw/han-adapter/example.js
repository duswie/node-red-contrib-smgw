class ExampleHanAdapter {
    constructor(config){
        this.config = config
    }
    testConnection(){
        if(this.config.ip != "192.168.1.200")
            return false;
        if(this.config.credentials.username != "testuser")
            return false;
        if(this.config.credentials.password != "password")
            return false;
        return true;
    }   
  }

  module.exports = ExampleHanAdapter;