"use client"

import { useState, useEffect, useMemo } from 'react';

interface BufferTag {    
    "spcOid": number;
    "dbOid": number;
    "relNumber": number;
    "forkNumber": number;
    "blockNumber": number;
}

interface BufferDesc {
    "refcount": number;
    "id": string;
    "locked": boolean;
    "dirty": boolean;
    "valid": boolean;
    "tagValid": boolean;
    "ioInProgress": boolean;
    "ioError": boolean;
    "justDirtied": boolean;
    "pinCountWaiter": boolean;
    "checkpointNeeded": boolean;
    "permanent": boolean;
    "tag": BufferTag;
}

export default function Buffers() {

    // 1. Let's fetch data
    const [forceFetchData, setForceFetchData] = useState(0);
    const [bufferDescs, setBufferDescs] = useState<BufferDesc[]>([]);

    useEffect(()=>{
        (async ()=> {
            const bufs = await fetch('http://localhost:6565/bufs');
            setBufferDescs(await bufs.json());
        })();
    }, [forceFetchData]);

    const activeBufferDescs = useMemo(()=>{
        return bufferDescs.filter(buf => buf.valid);
    }, [bufferDescs])



    return <div>
        <div>Total buffers: {bufferDescs.length} | Valid buffers: {activeBufferDescs.length}</div>
        <div>
            <h3>Example</h3>
            <pre>{JSON.stringify(bufferDescs[0], null, 2)}</pre>
        </div>
    </div>
}