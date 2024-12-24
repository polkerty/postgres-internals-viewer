import { open } from 'fs/promises'

const PAGE_SIZE = 8192;
const HEADER_SIZE = 24;

function bufToBytes(buf) {
    let ret = '';
    for (const byte of buf) {
        ret += byte.toString(16) + ' '
    }
    return ret;
}

class Group {
    constructor(name, position) {
        this.name = name;
        this.slots = [];
        this.position = position;
        this.length = 0;
    }

    add(slot) {
        this.slots.push(slot);
        slot.position = this.length;
        this.length += slot.length;
    }

    toString() {
        let out = 'Group: ' + this.name + '\n';
        for ( const slot of this.slots) {
            out += '\t' + slot.toString() + '\n';
        }
        return out;
    }
}

class Slot {
    constructor(name, buf) {
        this.name = name;
        this.buf = buf;
        this.length = buf.length;
    }

    toString() {
        return 'Slot: ' + this.name + ' | Length: ' + this.length + ' | Contents: ' + bufToBytes(this.buf)
    }
}

function makeHeapTablePageHeader(buf) {
    const group = new Group("Header", 0);
    group.add(new Slot("pd_lsn", Buffer.from(buf.buffer, 0, 8)));
    group.add(new Slot("pd_checksum", Buffer.from(buf.buffer, 8, 2)));
    group.add(new Slot("pd_flags", Buffer.from(buf.buffer, 10, 2)));
    group.add(new Slot("pd_lower", Buffer.from(buf.buffer, 12, 2)));
    group.add(new Slot("pd_upper", Buffer.from(buf.buffer, 14, 2)));
    group.add(new Slot("pd_special", Buffer.from(buf.buffer, 16, 2)));
    group.add(new Slot("pd_prune_xid", Buffer.from(buf.buffer, 18, 2)));
    group.add(new Slot("pd_pagesize_version", Buffer.from(buf.buffer, 20, 4)));
    return group;
}

class HeapTablePage {
    constructor(buffer) {
        // 1. Read header
        this.header = makeHeapTablePageHeader(Buffer.from(buffer.buffer, 0, 24));

        this.groups = [this.header];



    }
}




function parseHeapTablePage(buf) {
    console.log("Page: ", buf);
    const page = new HeapTablePage(buf);

    console.log(page);

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