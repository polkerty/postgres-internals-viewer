const { open } = require('fs/promises');
const { parseItemIdData, parseCTIDData, parseInt16, parseInt32, parseStr } = require('./helpers/dataParsers')
const { renderItemIdData, positionToStr } = require('./helpers/dataRenderers')


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
        slot.position = this.position + this.length;
        this.length += slot.length;
    }

    get(name) {
        return this.slots.find(slot => slot.name === name);
    }

    toString() {
        let out = 'Group: ' + this.name + '\n';
        for (const slot of this.slots) {
            out += '\t' + slot.toString() + '\n';
        }
        return out;
    }
}

class Slot {
    constructor(name, buf, parser, renderer) {
        this.name = name;
        this.buf = buf;
        this.length = buf.length;
        this.position = '-';
        if (parser) {
            this.data = parser(buf);
        } else {
            this.data = {}
        }
        this.renderer = renderer;
    }

    toString() {
        const dataStr = this.renderer? this.renderer(this.data) : JSON.stringify(this.data);
        return `[${positionToStr(this.position)}] ` + 'Slot: ' + this.name + ' | Length: ' +
            this.length + ' | Contents: ' + bufToBytes(this.buf) + ' | Data: ' +
            dataStr
    }
}

function makeHeapTablePageHeader(buf, startPos) {
    const group = new Group("Header", startPos);
    group.add(new Slot("pd_lsn", Buffer.from(buf.buffer, 0, 8)));
    group.add(new Slot("pd_checksum", Buffer.from(buf.buffer, 8, 2), parseInt16));
    group.add(new Slot("pd_flags", Buffer.from(buf.buffer, 10, 2)));
    group.add(new Slot("pd_lower", Buffer.from(buf.buffer, 12, 2), parseInt16));
    group.add(new Slot("pd_upper", Buffer.from(buf.buffer, 14, 2), parseInt16));
    group.add(new Slot("pd_special", Buffer.from(buf.buffer, 16, 2), parseInt16));
    group.add(new Slot("pd_prune_xid", Buffer.from(buf.buffer, 18, 2)));
    group.add(new Slot("pd_pagesize_version", Buffer.from(buf.buffer, 20, 4)));
    return group;
}

function getFreeSpace(buf, headers) {
    const start = headers.get('pd_lower').data.value, end = headers.get('pd_upper').data.value;
    const len = end - start;
    const group = new Group("Free space", start);


    group.add(new Slot("hole", Buffer.from(buf.buffer, start, len)));

    return group;

}

function getLinePointers(buf, startPos) {
    const group = new Group("Line pointers", startPos);
    let pos = startPos;
    let idx = 1;
    for (; ; ++idx) {
        const top = Buffer.from(buf.buffer, pos, LINE_POINTER_SIZE);
        if (top.readInt32LE(0) === 0) {
            // No line pointer
            break;
        }
        group.add(new Slot(`linep[${idx}]`, top, parseItemIdData(idx), renderItemIdData));
        pos += LINE_POINTER_SIZE;
    }

    return group;

}

function getTuples(buf, headers, linePointers) {

    // Let's assume there's always at least ONE pointer in a page.
    // Therefore, start of region == headers.pd_upper
    const group = new Group("Tuples", headers.get('pd_upper').data.value);

    for ( const linePointer of linePointers.slots.reverse()) {
        // Process the line pointers in reverse order, in keeping
        // with the layout flow of the page
        const data = Buffer.from(buf.buffer, linePointer.data.lp_off, linePointer.data.lp_len);
        const TUPLE_BASE = linePointer.data.lp_off;
        const t_xmin = Buffer.from(buf.buffer, TUPLE_BASE + 0, 4);
        const t_xmax = Buffer.from(buf.buffer, TUPLE_BASE + 4, 4);
        const t_cid = Buffer.from(buf.buffer, TUPLE_BASE + 8, 4);
        const t_xvac = Buffer.from(buf.buffer, TUPLE_BASE + 12, 4);
        const t_ctid = Buffer.from(buf.buffer, TUPLE_BASE + 12, 6);

        group.add(new Slot(`\ttuple[${linePointer.data.index}].t_xmin`, t_xmin, parseInt32));
        group.add(new Slot(`\ttuple[${linePointer.data.index}].t_xmax`, t_xmax, parseInt32));
        group.add(new Slot(`\ttuple[${linePointer.data.index}].t_cid`, t_cid, parseInt32));
        group.add(new Slot(`\ttuple[${linePointer.data.index}].t_xvac`, t_xvac, parseInt32));
        group.add(new Slot(`\ttuple[${linePointer.data.index}].t_ctid`, t_ctid, parseCTIDData));
        group.add(new Slot(`tuple[${linePointer.data.index}]`, data, parseStr));
    }

    return group;

}

class HeapTablePage {
    constructor(buffer, startPos) {
        // 1. Read header
        this.startPos = startPos;
        this.header = makeHeapTablePageHeader(Buffer.from(buffer.buffer, 0, HEADER_SIZE), startPos);


        this.linePointers = getLinePointers(
            Buffer.from(buffer.buffer, HEADER_SIZE, buffer.length - HEADER_SIZE),
            startPos + HEADER_SIZE);

        
        this.freeSpace = getFreeSpace(buffer, this.header);

        this.tuples = getTuples(buffer, this.header, this.linePointers);

        this.groups = [this.header, this.linePointers, this.freeSpace, this.tuples];

    }
}




function parseHeapTablePage(buf, startPos) {
    console.log("Page: ", buf);
    const page = new HeapTablePage(buf, startPos);

    for (const group of page.groups) {
        console.log(group.toString());
    }


}

const readHeapTable = async () => {

    const handler = await open('/Users/jbrazeal/postgres/db1/base/16384/49186', 'r');
    let start = 0;

    console.log("Parsing file");

    let totalBytesRead = 0;

    while (true) {
        const { buffer, bytesRead } = await handler.read(Buffer.alloc(PAGE_SIZE), 0, PAGE_SIZE, start)

        if (!bytesRead) break;

        parseHeapTablePage(buffer, totalBytesRead);

        start += bytesRead;

        totalBytesRead += bytesRead;
    }

    console.log("total bytes read: ", totalBytesRead);

};

readHeapTable();