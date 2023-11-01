const net = require('net');
const port = 2001;
const header_reserved = [0xAA, 0x00];
const frame_type = [0x01, 0xC0, 0xC1];
let ezi_io_modules = {};


class ezi_io_module_class {
    constructor(id, host) {
        this.id = id;
        this.cur_sync_data = { cur_sync_num: 0, cur_frame_type: 0 };
        this.input_req_ms = 30;
        this.device_slave_info;
        this.client = new net.Socket();

        this.client.connect(port, host, () => {
            console.log(`ezi-io module ${this.id} Connected to ${host} device ${module}`);
            let temp_json = { device_id: this.id.toString(), type: "2", time: "", data: "connection" };
            this.cur_sync_data.cur_frame_type = frame_type[0];
            this.cur_sync_data.cur_sync_num = write_req(this);
        });

        this.client.on('data', (data) => {
            if ((data[2] == this.cur_sync_data.cur_sync_num) && (data[4] == this.cur_sync_data.cur_frame_type)) {
                this.nxt_sync_num = this.nxt_sync_num + 1;
                if (this.nxt_sync_num >= 254) {
                    this.nxt_sync_num = 1;
                }
                if (data[4] == 0x01) {
                    console.log(`ezi-io module ${this.id} Received: ` + data);
                    this.cur_sync_data = { cur_sync_num: this.nxt_sync_num, cur_frame_type: frame_type[2] };
                    let dev_req_buf = Buffer.from([header_reserved[0], 0x07, this.cur_sync_data.cur_sync_num, header_reserved[1], this.cur_sync_data.cur_frame_type, 0xff, 0xff, 0xff, 0xff]);
                    this.client.write(dev_req_buf);
                    this.nxt_sync_num = this.nxt_sync_num + 1;
                }
                else if ((data[4] == 0xC0)) {
                    console.log(`ezi-io module ${this.id} Received: ` + data.toString('hex'));
                    if (data[10] == 0xff) {
                        this.cur_sync_data = { cur_sync_num: this.nxt_sync_num, cur_frame_type: frame_type[2] };
                        let dev_req_buf = Buffer.from([header_reserved[0], 0x07, this.cur_sync_data.cur_sync_num, header_reserved[1], this.cur_sync_data.cur_frame_type, 0xff, 0xff, 0xff, 0xff]);
                        this.client.write(dev_req_buf);
                        this.nxt_sync_num = this.nxt_sync_num + 1;
                    }
                }
                else if ((data[4] == 0xC1)) {
                    console.log(`ezi-io module ${this.id} Received: ` + data[5]);
                }

                if (this.device_module_type === "input") {
                    this.cur_sync_data = { cur_sync_num: this.nxt_sync_num, cur_frame_type: frame_type[1] };
                    let dev_req_buf = Buffer.from([header_reserved[0], 0x03, this.cur_sync_data.cur_sync_num, header_reserved[1], this.cur_sync_data.cur_frame_type]);
                    setTimeout(() => {
                        this.client.write(dev_req_buf);
                    }, this.input_req_ms);

                }
            }
        });
        this.client.on('error', () => {
            console.log(`ezi-io module ${this.id} Connection fail`);
            destroy_connection(this, "2", "fail");
        });
        this.client.on('close', () => {
            console.log(`ezi-io module ${this.id} Connection closed`);
            destroy_connection(this, "3", "disconnection");
        });
    }
}

function create_connection(dev_id, ip) {
    if (dev_id in ezi_io_modules == false) {
        ezi_io_modules[dev_id] = new ezi_io_module_class(dev_id, ip);
    }
}

function destroy_connection(selected_module, type_num, data_res) {
    ezi_io_modules[selected_module.id].client.destroy();
    delete ezi_io_modules[selected_module.id];
}

function write_req(selected_module, req_data) {
    let req_frame_type = selected_module.cur_sync_data.cur_frame_type;
    let cur_sync_no = selected_module.cur_sync_data.cur_sync_num;
    if(req_frame_type == 0x01 || req_frame_type == 0xc0 ||req_frame_type == 0xc3 || req_frame_type == 0xbd 
        ||req_frame_type == 0xc5 ||req_frame_type == 0x0ca ||req_frame_type == 0xcc ||req_frame_type == 0xcd)
    {
        let dev_req_buf = Buffer.from([header_reserved[0], 0x03, cur_sync_no, header_reserved[1], req_frame_type]);
        selected_module.client.write(dev_req_buf);
    }
    return cur_sync_no+1;
}


setTimeout(function () {
    create_connection("105", "192.168.0.105");
    create_connection("57", "192.168.0.57");
    create_connection("137", "192.168.0.137");
}, 1000);

/*setTimeout(function () {
    destroy_connection(ezi_io_modules['105'], "3", "disconnection");
    destroy_connection(ezi_io_modules['57'], "3", "disconnection");
    destroy_connection(ezi_io_modules['137'], "3", "disconnection");

}, 10000);*/
