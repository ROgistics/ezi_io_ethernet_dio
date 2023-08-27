const ezi_io_module = require('./ezi_io_module.js');

let ezi_io_modules = {};

function create_connection(dev_id, ip, port) {
    if (dev_id in ezi_io_modules == false) {
        ezi_io_modules[dev_id] = new ezi_io_module(dev_id, ip, port);
    }
}

create_connection("105", "192.168.0.105", 2002);
create_connection("37", "192.168.0.37", 2002);

setTimeout(()=>{
    ezi_io_modules['105'].destroy_connection(ezi_io_modules['105']);
},1000);
setTimeout(()=>{
    ezi_io_modules['37].write_data_req(0x01);
},500);
setTimeout(()=>{
    let req_buf = [0xff, 0xff, 0xff, 0xff];
    ezi_io_modules['37].write_data_req(0xc1, req_buf);
},1000);
setTimeout(()=>{
    let req_buf = [0x00, 0x00, 0x00, 0x00];
    ezi_io_modules['37].write_data_req(0xc1, req_buf);
},2000);
