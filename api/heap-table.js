import { open } from 'fs/promises'
import { start } from 'repl';

const PAGE_SIZE = 8192;
const HEADER_SIZE = 24;
const LINE_POINTER_SIZE = 4;

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

function makeHeapTablePageHeader(buf, startPos) {
    const group = new Group("Header", startPos);
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

function getLinePointers(buf, startPos) {
    const group = new Group("Line pointers", startPos);
    let pos = startPos;
    let idx = 0;
    for (;;++idx) {
        const top = Buffer.from(buf.buffer, pos, LINE_POINTER_SIZE);
        if ( top.readInt32LE(0) === 0) {
            // No line pointer
            break;
        }
        group.add(new Slot(`linep[${idx}]`, top));
        pos += LINE_POINTER_SIZE;
    }

    return group;
    

}

class HeapTablePage {
    constructor(buffer, startPos) {
        // 1. Read header
        this.header = makeHeapTablePageHeader(Buffer.from(buffer.buffer, 0, HEADER_SIZE), startPos);
        this.startPos = startPos;

        this.linePointers = getLinePointers(
            Buffer.from(buffer.buffer, HEADER_SIZE, buffer.length - HEADER_SIZE), 
            startPos + HEADER_SIZE);


        this.groups = [this.header, this.linePointers];



    }
}




function parseHeapTablePage(buf, startPos) {
    console.log("Page: ", buf);
    const page = new HeapTablePage(buf, startPos);

    console.log(page);

    for ( const group of page.groups ) {
        console.log(group.toString());
    }


}

const readHeapTable = async () => {

    const handler = await open('/Users/jbrazeal/postgres/db1/base/16384/16385', 'r');
    let start = 0;

    console.log("Parsing file");

    let totalBytesRead = 0;

    while (true) {
        const { buffer, bytesRead } = await handler.read(Buffer.alloc(PAGE_SIZE), 0, PAGE_SIZE, start)

        if ( !bytesRead ) break;

        parseHeapTablePage(buffer, totalBytesRead);

        start += bytesRead;
        
        totalBytesRead += bytesRead;
    }

    console.log("total bytes read: ", totalBytesRead);

};

readHeapTable();