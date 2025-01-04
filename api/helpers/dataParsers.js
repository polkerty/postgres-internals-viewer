
/*
 * A line pointer on a buffer page.  See buffer page definitions and comments
 * for an explanation of how line pointers are used.
 *
 * In some cases a line pointer is "in use" but does not have any associated
 * storage on the page.  By convention, lp_len == 0 in every line pointer
 * that does not have storage, independently of its lp_flags state.
 */

/*
typedef struct ItemIdData
{
	unsigned	lp_off:15,		 offset to tuple (from start of page) 
				lp_flags:2,		 state of line pointer, see below 
				lp_len:15;		 byte length of tuple 
} ItemIdData;

typedef ItemIdData *ItemId;
*/

export const parseItemIdData = (index) => (buffer, offsetInBuffer = 0) => {
    // Read the 4 bytes as an unsigned 32-bit integer in *little-endian* order.
    // (PostgreSQL typically stores pages in the server’s native endianness,
    //  which on most modern machines is little-endian.)
    const rawValue = buffer.readUInt32LE(offsetInBuffer);
  
    // Extract fields:
    //   15 bits of lp_off  => rawValue & 0x7FFF
    //    2 bits of lp_flags => (rawValue >> 15) & 0x03
    //   15 bits of lp_len  => (rawValue >> 17) & 0x7FFF
    const lp_off   =  rawValue         & 0x7FFF;
    const lp_flags = (rawValue >> 15)  & 0x03;
    const lp_len   = (rawValue >> 17)  & 0x7FFF;
  
    return { lp_off, lp_flags, lp_len, index };
  }


// Use when we don't want to parse the data at all
export const parseNone = () => ({ });

export const parseInt16 = buf => ({ value: buf.readInt16LE(0)});

export const parseInt32 = buf => ({ value: buf.readInt32LE(0)});

export const parseStr = buf => ({ text: buf.toString() });