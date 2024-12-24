export function renderItemIdData(itemIdData) {

    const flags = {
        0: "LP_UNUSED",
        1: "LP_NORMAL",
        2: "LP_REDIRECT",
        3: "LP_DEAD",
    }

    return JSON.stringify({
        lp_off: positionToStr(itemIdData.lp_off),
        lp_flags: flags[itemIdData.lp_flags],
        lp_len: itemIdData.lp_len
    })
  }
  

export function positionToStr(pos, width = 8) {
    const raw = pos.toString(16);
    width = Math.max(width, raw.length);
    let padded = '0x';
    for (let i = 0; i < width - raw.length; ++i) padded += '0';
    padded += raw;
    return padded;
}
