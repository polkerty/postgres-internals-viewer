"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
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

function colorOfRel(relId: number) {
    const red = relId % 256;
    const blue = (relId * 1773) % 256;
    const green = (relId * 1991) % 256;

    return `rgb(${red}, ${green}, ${blue})`;
}

function BufferDesc ({buffer, distinctColors}:{ buffer: IBufferDesc, distinctColors: boolean}) {

    const [showPopup, setShowPopup] = useState(false);

    let className = 'buffer';
    if ( buffer.locked ) {
        className += ' buffer--locked';
    }
    if ( buffer.dirty ) {
        className += ' buffer--dirty';
    }

    const closeDetails = useCallback(()=>{
        return false;
    }, [setShowPopup]);

    const style = useMemo(()=> {
        return distinctColors ? {
            backgroundColor: colorOfRel(buffer.tag.relNumber)
        } : {}
    }, [distinctColors]);

    return <div className={className} style={style} onClick={()=>setShowPopup(x=>!x)} >
        <div className="buffer__cell" >
            <div>{ buffer.tag.relNumber}</div>
            <div>{ buffer.tag.blockNumber }</div>
        </div>
        { showPopup && <div className="buffer__details" >
            <div>
                <pre>{JSON.stringify(buffer, null, 2)}</pre>
            </div>
            <div className='buffer__details__close' onClick={closeDetails}>close</div>
        </div>
        }
    </div>
}

export default function Buffers() {

    // 1. Let's fetch data
    const [forceFetchData, setForceFetchData] = useState(0);
    const [bufferDescs, setBufferDescs] = useState<IBufferDesc[]>([]);
    const [distinctColors, setDistinctColors] = useState(false);

    useEffect(()=>{
        (async ()=> {
            const bufs = await fetch('http://localhost:6565/bufs');
            setBufferDescs(await bufs.json());
        })();
    }, [forceFetchData]);

    const activeBufferDescs = useMemo(()=>{
        return bufferDescs.filter(buf => buf.valid);
    }, [bufferDescs])

    return (<div style={{position:"relative"}}>
        <div className="buffer-header">
            <div>Total buffers: {bufferDescs.length} | Valid buffers: {activeBufferDescs.length}</div>
            <div>
                <button onClick={()=>setForceFetchData(x => x + 1)}>Refresh</button>
                <button onClick={()=>setDistinctColors(x => !x)}>{
                    distinctColors ? "Don't use distinct colors" : "Use distinct colors"
                }</button>
            </div>
        </div>

        <div className='buffer-map' >
            {
                activeBufferDescs.map(b => <BufferDesc key={b.id} buffer={b} distinctColors={distinctColors} />)
            }
        </div>
    </div>);
}