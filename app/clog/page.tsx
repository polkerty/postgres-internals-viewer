"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import './clog.css'


export default function Clog() {

    // 1. Let's fetch data
    const [forceFetchData, setForceFetchData] = useState(0);
    const [clog, setClog] = useState(false);

    useEffect(()=>{
        (async ()=> {
            const clog = await fetch('http://localhost:6565/clog');
            setClog(await clog.json());
        })();
    }, [forceFetchData]);

    return (<div style={{position:"relative"}}>
        <div>
            <div>
                <button onClick={()=>setForceFetchData(x => x + 1)}>Refresh</button>
            </div>
            <pre>
                {
                    JSON.stringify(clog, null, 2)
                }
            </pre>
        </div>
    </div>);
}