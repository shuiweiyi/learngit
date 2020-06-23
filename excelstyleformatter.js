// import numeral from 'numeral';
// import dateFormat from 'dateformat';

var excelstyleformatter = {
    addThousand: function (strs) {
        var strArray = strs.split('.');
        var str = strArray[0];
        var length = str.length - (str[0] === '-' ? 1 : 0);
        var start = str.length - Math.floor((length-1)/3) * 3;
        var res = str.slice(0, start);
        for (var i = start; i < str.length; i+=3) {
            res += ',' + str.slice(i, i+3);
        }
        return res + (strArray.length > 1 ? '.' + strArray[1] : '');
    },
    format: function (val, styles) {
        if (val === null)   return {value:"null"};
        if (styles.trim() === '@' && typeof val === 'string') {
            return {value: styles.replace('@', val)};
        } else if (styles.trim()=== '@' && (val === null || val === undefined || isNaN(val))) {
            return {value: styles.replace('@', '')};
        } else if(styles.trim() === '@') {
            return {value: styles.replace('@', val)};
        }
        if (styles[0] === '.') {
            if (typeof val === 'string') {
                return {value:val};
            }
            if (val === null || val === undefined) {
                val = 0;
            }
            var color = false, triangle = false, zero = false, sign = 1;
            styles = styles.replace('c', function() {
                color = true;
                return '';
            }).replace('t', function() {
                triangle = true;
                return '';
            }).replace('z', function() {
                zero = true; // show zero (default show -) if val === 0
                return '';
            }).replace('%', function() {
                val = val * 100;
                return val === 0  ? ' ' : '%';
            }).replace(/\.(\d)/, function(m, p1) {
                if (triangle) {
                    if (val !== 0 || zero) {
                        return (val > 0 ? '▲' : '▼') + excelstyleformatter.addThousand(Math.abs(val).toFixed(Number(p1)));
                    } else {
                        return '-' + Array(Number(p1)+1).join(' ');
                    }
                } else {
                    if (val !== 0 || zero) {
                        return excelstyleformatter.addThousand(val.toFixed(Number(p1)));
                    } else {
                        sign = 0;
                        return '-' + Array(Number(p1)+1).join(' ');
                    }
                }
            });
            if (color && val !== 0) {
                return {color: val > 0 ? 'red' : 'green', value: styles, };
            } else {
                return {value: styles, };
            }
        }
        styles = styles.split(';');
        var style;
        var result = {}, value = '';

        if (val === null || val === undefined) {
            return {value: ''};
        }

        if (styles.length > 4) {
            styles = styles.slice(0, 4);
        }

        // if val is a string
        if (styles[0].search(/yyyy|mm|dd|MM|DD|YYYY/) >= 0) {
            if (val === null || val === undefined) {
                return {value: '',};
            }
            value = dateFormat(new Date(val), styles[0].replace(/\[(Red|Green|White|Blue|Magenta|Yellow|Cyan|Black)]/i, function(matched, color) {
                result.color = color;
                return '';
            }).replace(/(\_.)/g, function() {
                return ' ';
            }));
        } else if (typeof val === 'string') {
            if (val === null) {
                return {value: '',};
            }
            if (styles.length < 4 && styles[styles.length-1] === '') {
                return {value: '',};
            }
            if (styles.length < 4 && styles[styles.length-1].indexOf('@') >= 0) {
                style = styles[styles.length-1];
            } else {
                return {value: val};
            }

            var value = style.replace(/\[(Red|Green|White|Blue|Magenta|Yellow|Cyan|Black)]/i, function(matched, color) {
                result.color = color;
                return '';
            }).replace(/(\_.)/g, '').replace(/@/g, val);
        } else {
            if (val === null) {
                val = 0;
            }
            if (val > 0) {
                style = styles[0];
            } else if (val < 0) {
                style = styles[styles.length >= 2 ? 1 : 0];
                if (styles.length >= 2) {
                    val = Math.abs(val);
                }
            } else {
                style = styles[styles.length >= 3 ? 2 : 0];
                val = 0;
                if (style ==='' || styles[Math.min(2, styles.length-1)] === '') {
                    return {value: '',};
                }
            }

            var value = style.replace(/\[(Red|Green|White|Blue|Magenta|Yellow|Cyan|Black)]/i, function(matched, color) {
                if (val !== 0 || (val === 0 && styles.length !== 2)) {
                    result.color = color;
                }
                return '';
            }).replace(/[0#$][0,.$#% ]*/, function (matched) {
                try{
                    return numeral(val).format(matched);
                }catch(e){
                    // console.error(e);
                    console.info('numeral format error', val, styles);
                    return val;
                }
                // return numeral(val).format(matched);
            }).replace(/(\_.)/g, function () {
                return ' ';
            });
        }
        result.value = value;
        return result;
    },

    // 此处，若styles表示它是一个文本，那么文本里的空格将不会被&nbsp;替换
    tohtml: function (val, styles) {
        var result = excelstyleformatter.format(val, styles);
        if (styles.indexOf('@') === -1) {
            result.value = result.value.replace(/  /g, '&nbsp;&nbsp;');
        }

        return 'color' in result ? '<span value="' + (typeof val === 'number' ? val : '') + '" style="color:' + result.color + '">' + result.value.replace(/  /g, '&nbsp;&nbsp;') + '</span>' : result.value;
    },
};

export default excelstyleformatter;
