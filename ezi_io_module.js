const net = require('net');

module.exports = class ezi_io_module_class {
    constructor(id, host, port) {
        this.id = id;
        this.cur_sync_data = { cur_sync_num: 0, cur_frame_type: 0 };
        this.nxt_sync_num = 0;
        this.client = new net.Socket();

        this.client.connect(port, host, () => {
            console.log(`ezi-io module ${this.id} Connected to ${host} device ${module}`);
        });
        this.client.on('data', (data) => {
            let ret = read_data_req(data);
            this.nxt_sync_num = ret.nxt_sync_num;
        });
        this.client.on('error', () => {
            console.log(`ezi-io module ${this.id} Connection fail`);
            this.client.destroy();
        });
        this.client.on('close', () => {
            console.log(`ezi-io module ${this.id} Connection closed`);
            this.client.destroy();
        });
    }
    read_data_req(read_data) {
        let ret;
        let chk_sync_num = this.cur_sync_data.cur_sync_num;
        let chk_frame_type = this.cur_sync_data.cur_frame_type;
        if ((read_data[2] == chk_sync_num) && (read_data[4] == chk_frame_type) && (read_data[5] == 0x00)) {
            if (read_data[4] == 0xc1 || read_data[4] == 0xc4 || read_data[4] == 0xc6 || read_data[4] == 0xc7
                || read_data[4] == 0xc8 || read_data[4] == 0xcb || read_data[4] == 0xcc || read_data[4] == 0xcd) {
                ret = { nxt_sync_num: ((data[2] + 1) <= 254) ? (data[2] + 1) : 0, cur_frame_type: data[4], cur_read_data: [0x00] };
            }
            else {
                ret = { nxt_sync_num: ((data[2] + 1) <= 254) ? (data[2] + 1) : 0, cur_frame_type: data[4], cur_read_data: read_data };
            }
        }
        return ret;
    }
    write_data_req(req_frame_type, req_data) {
        let dev_req_buf;
        let nxt_sync_no = this.nxt_sync_num;
        if (req_frame_type == 0x01 || req_frame_type == 0xc0 || req_frame_type == 0xc3 || req_frame_type == 0xbd
            || req_frame_type == 0xc5 || req_frame_type == 0x0ca || req_frame_type == 0xcc || req_frame_type == 0xcd) {
            dev_req_buf = Buffer.from([0xAA, 0x03, nxt_sync_no, 0x00, req_frame_type]);
        }
        else {
            let length = 0x03 + req_data.length;
            let temp_req_data = Buffer.from(req_data);
            let temp_req_buf = Buffer.from([0xAA, length, nxt_sync_no, 0x00, req_frame_type]);
            dev_req_buf = Buffer.concat([temp_req_buf, temp_req_data], length + 2);
        }
        this.client.write(dev_req_buf);
        let cur_sync_data = { cur_sync_num: nxt_sync_no, cur_frame_type: req_frame_type };
        return cur_sync_data;
    }
}

