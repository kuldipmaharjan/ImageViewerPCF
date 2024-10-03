
export const genPluralName = (entityName: string) : string => {
    let pluralEntityName = ""
    
    const len = entityName.length;
    const lastChar = len > 0 ? entityName.slice(-1) : ''
    const last2Char = len > 1 ? entityName.slice(-2) : ''

    if (['s', 'x', 'z'].includes(lastChar) || ['ch', 'sh'].includes(last2Char)) {
        pluralEntityName = entityName + 'es'
    }
    else if (lastChar == 'y') {
        pluralEntityName = entityName.substring(0, len - 1) + 'ies'
    }
    else {
        pluralEntityName = entityName + 's'
    }

    return pluralEntityName
}