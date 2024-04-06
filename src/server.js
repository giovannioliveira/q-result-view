import { open } from 'node:fs/promises'
const divider = /^[ ]{0,2}(\d{1,3}:\d{2})\s+------------------------------------------------------------\n?$/
const score = /^\s*(\d{1,3}:\d{2})\s+score:\s+([-]?\d+)\s+ping:\s+(\d+)\s+client:\s+(\d+)([^\n]*)\s*\n?$/
const say = /^\s*(\d{1,3}:\d{2})\s+say/
const red_blue = /^[ ]{0,2}(\d{1,3}:\d{2})\s*red:(\d+)\s*blue:(\d+)\s*\n?$/
const preffix = /^\s*(\d{1,3}:\d{2})\s*(\w+):\s*([^\n]*)\n?$/
const suffix = {
    'InitGame': /^(|([\w\_\s]+)|([\w\_\s]+))+\s*$/,
    'Kill': /^\s*(\d+)\s(\d+)\s(\d+):\s*([^\n]+)\s+killed\s+([^\n]+)\s+by\s+([^\n]+)$/,
    'Exit': /^\s*([^\n]+)$/,
    'ClientConnect': /^\s*(\d+)$/,
    'ClientUserinfoChanged': /^\s*(\d+)\s*(([\w\_\s]+)|([\w\_\s]+)|)+\s*$/,
    'ClientBegin': /^\s*(\d+)\s*$/,
    'Item': /^\s*(\d+)\s+([^\n]+)$/,
    'ClientDisconnect': /^\s*(\d+)$/,
    'ShutdownGame': null
}
var MATCHES = {}
async function _main() {
    var __readableFile = null
    var __active = null
    let i = 0
    try {
        __readableFile = await open(process.env.INPUT_STREAM || 'data/qgames')
        for await (const line of __readableFile.readLines()) {
            if (line.match(divider) || line.match(say) || line.match(score) || line.match(red_blue)) {
                continue
            }
            try {
                let parsed = line.match(preffix)
                let action = parsed[2]
                if (parsed == null) {
                    throw Error("WRONG_PREFIX", line)
                } else if (!(action in suffix)) {
                    throw Error("WRONG_ACTION", line)
                }
                if (action == 'ShutdownGame') {
                    MATCHES[__active]['PLAYERS'] = Object.keys(MATCHES[__active]['SCORE'])
                    __active = null
                    continue
                } else if (action == 'InitGame') {
                    let props = {}
                    props['DEATH_CAUSE'] = {}
                    props['KILLS'] = {}
                    props['SCORE'] = {}
                    props['TOTAL_KILLS'] = 0
                    __active = 'MATCH_' + i
                    i++
                    MATCHES[__active] = props
                    continue
                } else if (action == 'ClientConnect') {
                    continue
                } else if (action == 'ClientUserinfoChanged') {
                    continue
                }
                let parsed_suffix = parsed[3].match(suffix[action])
                if (parsed_suffix == null) {
                    throw Error("WRONG_SUFFIX", line)
                }
                if (action == 'Kill') {
                    let killer = parsed_suffix[4]
                    let killed = parsed_suffix[5]
                    let gun = parsed_suffix[6]
                    MATCHES[__active]['TOTAL_KILLS']++
                    if (killer != '<world>') {
                        if (killer in MATCHES[__active]['KILLS']) {
                            MATCHES[__active]['KILLS'][killer] += 1
                        } else {
                            MATCHES[__active]['KILLS'][killer] = 1
                        }
                        if (killer in MATCHES[__active]['SCORE']) {
                            MATCHES[__active]['SCORE'][killer] += 1
                        } else {
                            MATCHES[__active]['SCORE'][killer] = 1
                        }
                    }
                    if (killed in MATCHES[__active]['SCORE']) {
                        MATCHES[__active]['SCORE'][killed] -= 1
                    } else {
                        MATCHES[__active]['SCORE'][killed] = -1
                    }
                    if (gun in MATCHES[__active]['DEATH_CAUSE']) {
                        MATCHES[__active]['DEATH_CAUSE'][gun] += 1
                    } else {
                        MATCHES[__active]['DEATH_CAUSE'][gun] = 1
                    }
                }
            } catch (err) {
                //console.error("Parse error: ", err, line)
            }
        }
    } catch (err) {
        
    } finally {
        try {
            if (__readableFile == null)
                console.error("Null source log file.")
            else{
                __readableFile.close()
            }
        } catch (err) {
            console.error('Error closing input stream.')
        }
    }
    
    console.log(MATCHES)
}
_main()

