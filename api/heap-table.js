import { open } from 'fs/promises'

const PAGE_SIZE = 8192;
const HEADER_SIZE = 24;


class Group {
    constructor(name, position) {
        this.name = name;
        this.slots = [];
        this.position = position;
        this.length = 0;
    }

    add(slot) {
        this.slots.push(slot);
        this.length += slot.length;
    }
}

class Slot {
    constructor(name, buf, position) {
        this.name = name;
        this.buf = buf;
        this.position = position;
        this.length = buf.length;
    }
}

function makeHeapTablePageHeader(buf) {
    const group = new Group("Header", [], 0, 24);
    group.add(new Slot("pd_lsn", Buffer.from(buf.buffer, 0, 8), 0, 8));
}

class HeapTablePageHeader {
    constructor(buf) {
        this

        console.log("Header buff: ", buf);
        // 1. PageXLogRecPtr       pd_lsn     ( int 32, int 32 )
        this.pd_lsn = {
            xlogid: buf.readInt32LE(0),
            xrecoff: buf.readInt32LE(4)
        };
        this.pd_checksum = buf.readInt16LE(8)
        this.pd_lower = buf.readInt16LE(10)
        this.pd_upper = buf.readInt16LE(12)
        this.pd_special = buf.readInt16LE(14)
    }

    toString() {
        return JSON.stringify({
            pd_lsn: {
                xlogid: this.pd_lsn.xlogid.toString(16),
                xrecoff: this.pd_lsn.xrecoff.toString(16)
            },
            pd_checksum: this.pd_checksum.toString(16),
            pd_lower: this.pd_lower.toString(16),
            pd_upper: this.pd_upper.toString(16),
            pd_special: this.pd_special.toString(16),
        }, null, 2);
    }
}

class HeapTablePage {
    constructor(buffer) {
        // 1. Read header
        this.header = new HeapTablePageHeader(Buffer.from(buffer.buffer, 0, 24));



    }
}




function parseHeapTablePage(buf) {
    console.log("Page: ", buf);
    const page = new HeapTablePage(buf);

    console.log("Header: ", page.header.toString())


}

const readHeapTable = async () => {

    const handler = await open('/Users/jbrazeal/postgres/db1/base/16384/16385', 'r');
    let start = 0;

    console.log("Parsing file");

    let totalBytesRead = 0;

    while (true) {
        const { buffer, bytesRead } = await handler.read(Buffer.alloc(PAGE_SIZE), 0, PAGE_SIZE, start)

        if ( !bytesRead ) break;

        parseHeapTablePage(buffer);

        start += bytesRead;
        
        totalBytesRead += bytesRead;
    }

    console.log("total bytes read: ", totalBytesRead);

};

readHeapTable();