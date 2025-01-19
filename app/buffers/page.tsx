"use client"

import { useState, useEffect, useMemo } from 'react';
import './buffers.css'

interface BufferTag {    
    "spcOid": number;
    "dbOid": number;
    "relNumber": number;
    "forkNumber": number;
    "blockNumber": number;
}

interface IBufferDesc {
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

function BufferDesc ({buffer}:{ buffer: IBufferDesc}) {
    let className = 'buffer';
    if ( buffer.locked ) {
        className += ' buffer--locked';
    }
    if ( buffer.dirty ) {
        className += ' buffer--dirty';
    }
    return <div className={className} >
        <div>{ buffer.tag.relNumber}</div>
        <div>{ buffer.tag.blockNumber }</div>
    </div>
}

export default function Buffers() {

    // 1. Let's fetch data
    const [forceFetchData, setForceFetchData] = useState(0);
    const [bufferDescs, setBufferDescs] = useState<IBufferDesc[]>([]);

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
        <button onClick={()=>setForceFetchData(x => x + 1)}>Refresh</button>
        <div className='buffer-map' >
            {
                activeBufferDescs.map(b => <BufferDesc buffer={b} />)
            }
        </div>
        <div>
            <h3>Example</h3>
            <pre>{JSON.stringify(bufferDescs[0], null, 2)}</pre>
        </div>
    </div>
}