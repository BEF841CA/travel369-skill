
var citysInfo = {
    "2500": {
        "cityId": 2500,
        "cityName": "济南",
        "cityFullName": "济南市",
        "cityEn":"JiNan",
        "cityPoint": [116, 36],
        "baiduCityId":288
    },
    "2534": {
        "cityId": 2534,
        "cityName": "宁津",
        "cityFullName": "宁津县",
        "cityEn": "NingJin",
        "cityPoint": [117, 37],
        "baiduCityId": 2902
    },
    "2342": {
        "cityId": 2342,
        "cityName": "灵璧",
        "cityFullName": "灵璧县",
        "cityEn": "LingBi",
        "cityPoint": [117, 34],
        "baiduCityId":370
    },
    "3511": {
        "cityId": 3511,
        "cityName": "莆田",
        "cityFullName": "莆田",
        "cityEn": "PuTian",
        "cityPoint": [118,26],
        "baiduCityId": 195
    }

}
var cityId = localStorage["cityId"];
if (!cityId) {
    cityId = "2500";
}

cityInfo = citysInfo[cityId];

function convertGeoToPoint(geo, last)
{
	var dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_+=,.<>!@#$%^&*()/?;`~:'";
	if (geo.length != 7) return undefined;
	var x87 = new BigNumber(0);
	for (var j = 0; j < 7; j++)
	{
		var tmp = dictionary.indexOf(geo[j]);
		if (tmp >= 0)
		{
			x87 = x87.multipliedBy(87).plus(tmp);
		}
		else
		{
			return undefined;//不是码表关键字
		}

    }
    var bin87 = x87.toString(2).padLeft(45,'0');
	var type = new BigNumber(bin87.substr(0,2),2).toNumber();
	var lng;
	var lat;
	var velo = 0;

	//45-44 type   43-41 velo   40-21 lng     20-1 lat
	//45-44 type                43-22 lng     21-1 lat

	if (type < 3)
	{
        lng = new BigNumber(bin87.substr(3, 21), 2).toNumber() / (bin87.substr(2, 1) == '1' ? -1000000 : 1000000) + cityInfo.cityPoint[0];
        lat = new BigNumber(bin87.substr(25, 20), 2).toNumber() / (bin87.substr(24, 1) == '1' ? -500000 : 500000) + cityInfo.cityPoint[1];                
	}
	else
	{
		lng = new BigNumber(bin87.substr(6,19),2).toNumber() / (bin87.substr(5,1)=='1'?-1000000:1000000) + last.lng;
		lat = new BigNumber(bin87.substr(26,19),2).toNumber() / (bin87.substr(25,1)=='1'?-1000000:1000000) + last.lat; 
		velo = new BigNumber(bin87.substr(2,3),2).toNumber();
		type = last.type; 
    }
    if (typeof (last) != 'number') {
        return {
            type: type,
            lng: lng,
            lat: lat,
            velocity: velo
        };
    } else {
        return convertPointType([lng,lat], type, last);
    }
	
}

function convertGeoToPoints(geo,toType)
{
    
	var res = [];
	var geoLength = geo.length;
	if (geoLength % 7 != 0) return [];//输入长度不符合规范
	var point = undefined;
	for (var i = 0; i < geoLength; i += 7)//解析每一组坐标
	{
		point = convertGeoToPoint(geo.substr(i, 7), point);
		res.push(point);
    }
    if (typeof (toType) != 'number') {
        return res;
    } else {
        var points = [];
        for (var j = 0; j < res.length; j++) {
            var p = convertPointType([res[j].lng, res[j].lat],res[j].type, toType);
            points.push([p[0], p[1], res[j].velocity]);
        }
        return points;
    }
	
}

String.prototype.padLeft = function (len, charStr) {
    var s = this + '';
    return new Array(len - s.length + 1).join(charStr, '') + s;
}


function convertPointToGeo(lng,lat,type,velocity)
{
    if (typeof (lng) != 'number') {
        lat = lng.lat;
        type = lng.type;
        velocity = lng.velocity;
        lng = lng.lng;
    }
	var dictionary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_+=,.<>!@#$%^&*()/?;`~:'";
	var withVelocity = type == 3;
	var res = "";
	var x = new BigNumber(type);
    var moveLen = withVelocity ? 19 : 21;
    var lngtmp = lng * 1000000;
    var lattmp = lat * 1000000;
	if (withVelocity)
	{
		x  = x.multipliedBy(8).plus(velocity);
	}
	else
    {
        lngtmp -= cityInfo.cityPoint[0] * 1000000;
        lattmp -= cityInfo.cityPoint[1] * 1000000;
	}
	x  = x.multipliedBy(2);
	if (lngtmp < 0)
	{
        lngtmp = -lngtmp;
		x  = x.plus(1);
    }
    x = x.multipliedBy(Math.pow(2, moveLen)).plus(lngtmp.toFixed());
	
	x  = x.multipliedBy(2);
	if (lattmp < 0)
	{
		lattmp = -lattmp;
		x  = x.plus(1);
	}
	if(!velocity){
		moveLen--;
        lattmp = (lattmp / 2).toFixed();
	}
	x  = x.multipliedBy(Math.pow(2,moveLen)).plus(lattmp);

	if (withVelocity)
	{
		if (lngtmp >= 1048576 || lattmp >= - 1048576 || lattmp <= 1048576 || lngtmp <= - 1048576 ) return undefined;//坐标范围不对
	}
	else
	{
		if (lngtmp >= 2097152|| lattmp >= 2097152|| lattmp <= -2097152 || lngtmp <= -2097152) return undefined;//坐标范围不对
	}

	//拼接字符串
	for (var j = 6; j >= 0; j--)
	{
		var y = x.mod(87);
		res = dictionary[y] + res;
		x = x.minus(y).dividedBy(87);
	}
	return res;
}

function convertPointsToGeo(points, withVelocity)
{
	var res = "";
	for (var i = 0; i < points.length; i++)
	{
		var t = points[i];
		if (withVelocity && i > 0)
		{
			t = {
				lng : t.lng - points[i - 1].lng,
				lat : t.lat - points[i - 1].lat,
				type : 3,
				velocity : t.velocity
			};
		}
		res+=convertPointToGeo(t);

	}
	return res;
}

function convertPointType(point, fromType, toType)
{
    var res = [point[0],point[1]];
    if (fromType == 0 && fromType < toType) {
        res = wgs84togcj02(res);
        fromType++;

    }
    if (fromType == 1 && fromType < toType) {
        res = gcj02tobd09(res);
        fromType++;

    }
    if (fromType == 2 && fromType > toType) {
        res = bd09togcj02(res);
        fromType--;

    }
    if (fromType == 1 && fromType > toType) {
        res = gcj02towgs84(res);
    }
    return res;
}

   

/**
 * 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
 * 即 百度 转 谷歌、高德
 * @param bd_lon
 * @param bd_lat
 * @returns {*[]}
 */
function bd09togcj02(point) {
    var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    var x = point[0] - 0.0065;
    var y = point[1] - 0.006;
    var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    var gg_lng = z * Math.cos(theta);
    var gg_lat = z * Math.sin(theta);
    return [gg_lng, gg_lat]
}

/**
 * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
 * 即谷歌、高德 转 百度
 * @param lng
 * @param lat
 * @returns {*[]}
 */
function gcj02tobd09(point) {
    var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
    var z = Math.sqrt(point[0] * point[0] + point[1] * point[1]) + 0.00002 * Math.sin(point[1] * x_PI);
    var theta = Math.atan2(point[1], point[0]) + 0.000003 * Math.cos(point[0] * x_PI);
    var bd_lng = z * Math.cos(theta) + 0.0065;
    var bd_lat = z * Math.sin(theta) + 0.006;
    return [bd_lng, bd_lat]
}

/**
 * WGS84转GCj02
 */
function wgs84togcj02(point) {
    if (out_of_china(point)) {
        return point;
    }
    else {
        var dlat = transformlat([point[0] - 105.0, point[1] - 35.0]);
        var dlng = transformlng([point[0] - 105.0, point[1] - 35.0]);
        var radlat = point[1] / 180.0 * Math.PI;
        var magic = Math.sin(radlat);
        magic = 1 - 0.00669342162296594323 * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic * Math.cos(radlat) * Math.PI);
        var mglat = point[1] + dlat;
        var mglng = point[0] + dlng;
        return [mglng, mglat]
    }
}

/**
 * GCJ02 转换为 WGS84
 * @returns {*[]}
 */
function gcj02towgs84(point) {
    if (out_of_china(point)) {
        return point;
    }
    else {
        var dlat = transformlat([point[0] - 105.0, point[1] - 35.0]);
        var dlng = transformlng([point[0] - 105.0, point[1] - 35.0]);
        var radlat = point[1] / 180.0 * Math.PI;
        var magic = Math.sin(radlat);
        magic = 1 - 0.00669342162296594323 * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtmagic) * Math.PI);
        dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic * Math.cos(radlat) * Math.PI);
        mglat = point[1] + dlat;
        mglng = point[0] + dlng;
        return [point[0] * 2 - mglng, point[1] * 2 - mglat]
    }
}

function transformlat(point) {
    var ret = -100.0 + 2.0 * point[0] + 3.0 * point[1] + 0.2 * point[1] * point[1] + 0.1 * point[0] * point[1] + 0.2 * Math.sqrt(Math.abs(point[0]));
    ret += (20.0 * Math.sin(6.0 * point[0] * Math.PI) + 20.0 * Math.sin(2.0 * point[0] * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(point[1] * Math.PI) + 40.0 * Math.sin(point[1] / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(point[1] / 12.0 * Math.PI) + 320 * Math.sin(point[1] * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret
}

function transformlng(point) {
    var ret = 300.0 + point[0] + 2.0 * point[1] + 0.1 * point[0] * point[0] + 0.1 * point[0] * point[1] + 0.1 * Math.sqrt(Math.abs(point[0]));
    ret += (20.0 * Math.sin(6.0 * point[0] * Math.PI) + 20.0 * Math.sin(2.0 * point[0] * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(point[0] * Math.PI) + 40.0 * Math.sin(point[0] / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(point[0] / 12.0 * Math.PI) + 300.0 * Math.sin(point[0] / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret
}

/**
 * 判断是否在国内，不在国内则不做偏移
 * @param lng
 * @param lat
 * @returns {boolean}
 */
function out_of_china(point) {
    return (point[0] < 72.004 || point[0] > 137.8347) || ((point[1] < 0.8293 || point[1] > 55.8271) || false);
}

function getAngle (pointa, pointb) {
    var a = (90 - pointb[1]) * Math.PI / 180;
    var b = (90 - pointa[1]) * Math.PI / 180;
    var AOC_BOC = (pointb[0] - pointa[0]) * Math.PI / 180;
    var cosc = Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b) * Math.cos(AOC_BOC);
    var sinc = Math.sqrt(1 - cosc * cosc);
    var sinA = Math.sin(a) * Math.sin(AOC_BOC) / sinc;
    var A = Math.asin(sinA) * 180 / Math.PI;
    var res = 0;
    if (pointb[0] > pointa[0] && pointb[1] > pointa[1]) res = A;
    else if (pointb[0] > pointa[0] && pointb[1] < pointa[1]) res = 270 - A;
    else if (pointb[0] < pointa[0] && pointb[1] < pointa[1]) res = 270 - A;
    else if (pointb[0] < pointa[0] && pointb[1] > pointa[1]) res = 90 + A;
    else if (pointb[0] > pointa[0] && pointb[1] == pointa[1]) res = 180;
    else if (pointb[0] < pointa[0] && pointb[1] == pointa[1]) res = 0;
    else if (pointb[0] == pointa[0] && pointb[1] > pointa[1]) res = 90;
    else if (pointb[0] == pointa[0] && pointb[1] < pointa[1]) res = 270;
    return res;
}


//计算距离
function calcDistance(point1, point2) {
    if (typeof (point1) == "string") {
        point1 = convertGeoToPoint(point1, 0);
    }
    if (typeof (point2) == "string") {
        point2 = convertGeoToPoint(point2, 0);
    }
    var lat1 = point1[1];
    var lat2 = point2[1];
    var lng1 = point1[0];
    var lng2 = point2[0];
    var radLat1 = lat1 * Math.PI / 180.0;
    var radLat2 = lat2 * Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    return s * 6370996.81;
}

; //计算垂距

function distToSegment(start, end, center) {
    //下面用海伦公式计算面积
    var a = Math.abs(calcDistance(start, end));
    var b = Math.abs(calcDistance(start, center));
    var c = Math.abs(calcDistance(end, center));
    var p = (a + b + c) / 2.0;
    var s = Math.sqrt(Math.abs(p * (p - a) * (p - b) * (p - c)));
    return s * 2.0 / a;
}

; //递归方式压缩轨迹

function compressLine(coordinate, result, start, end, dMax) {
    if (start < end) {
        var maxDist = 0;
        var currentIndex = 0;
        var startPoint = coordinate[start];
        var endPoint = coordinate[end];

        for (var i = start + 1; i < end; i++) {
            var currentDist = distToSegment(startPoint, endPoint, coordinate[i]);

            if (currentDist > maxDist) {
                maxDist = currentDist;
                currentIndex = i;
            }
        }

        if (maxDist >= dMax) {
            //将当前点加入到过滤数组中
            result.push(coordinate[currentIndex]); //将原来的线段以当前点为中心拆成两段，分别进行递归处理

            compressLine(coordinate, result, start, currentIndex, dMax);
            compressLine(coordinate, result, currentIndex, end, dMax);
        }
    }

    return result;
}

;

function douglasPeucker(coordinate, dMax) {
    if (!coordinate || !(coordinate.length > 2)) {
        return coordinate;
    }

    coordinate.forEach(function (item, index) {
        item.key = index;
    });
    var result = compressLine(coordinate, [], 0, coordinate.length - 1, dMax);
    result.push(coordinate[0]);
    result.push(coordinate[coordinate.length - 1]);
    var resultLatLng = result.sort(function (a, b) {
        if (a.key < b.key) {
            return -1;
        } else if (a.key > b.key) return 1;

        return 0;
    });
    resultLatLng.forEach(function (item) {
        item.key = undefined;
    });
    return resultLatLng;
}

//（5）百度经纬度坐标转百度墨卡托坐标：
var LLBAND = [75, 60, 45, 30, 15, 0]

var LL2MC = [

    [-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5],

    [0.0008277824516172526, 111320.7020463578, 647795574.6671607, -4082003173.641316, 10774905663.51142, -15171875531.51559, 12053065338.62167, -5124939663.577472, 913311935.9512032, 67.5],

    [0.00337398766765, 111320.7020202162, 4481351.045890365, -23393751.19931662, 79682215.47186455, -115964993.2797253, 97236711.15602145, -43661946.33752821, 8477230.501135234, 52.5],

    [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5],

    [-0.0003441963504368392, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5],

    [-0.0003218135878613132, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]

]

function getRange(cC, cB, T) {
    if (cB != null) {
        cC = Math.max(cC, cB);
    }
    if (T != null) {
        cC = Math.min(cC, T);
    }
    return cC;
}

function getLoop(cC, cB, T) {
    while (cC > T) {
        cC -= T - cB;
    }
    while (cC < cB) {
        cC += T - cB;
    }
    return cC;
}

function convertor(cC, cD) {
    if (!cC || !cD) {
        return null;
    }
    let T = cD[0] + cD[1] * Math.abs(cC.x);
    const cB = Math.abs(cC.y) / cD[9];
    let cE = cD[2] + cD[3] * cB + cD[4] * cB * cB +
        cD[5] * cB * cB * cB + cD[6] * cB * cB * cB * cB +
        cD[7] * cB * cB * cB * cB * cB +
        cD[8] * cB * cB * cB * cB * cB * cB;
    T *= (cC.x < 0 ? -1 : 1);
    cE *= (cC.y < 0 ? -1 : 1);
    return [T, cE];
}


//convertbd09tomc({x:116,y:36})
function convertbd09tomc(T) {
    let cD, cC, len;
    T.x = getLoop(T.x, -180, 180);
    T.y = getRange(T.y, -74, 74);
    const cB = T;
    for (cC = 0, len = LLBAND.length; cC < len; cC++) {
        if (cB.y >= LLBAND[cC]) {
            cD = LL2MC[cC];
            break;
        }
    }
    if (!cD) {
        for (cC = LLBAND.length - 1; cC >= 0; cC--) {
            if (cB.y <= -LLBAND[cC]) {
                cD = LL2MC[cC];
                break;
            }
        }
    }
    const cE = convertor(T, cD);
    return cE;
}


//（6）百度墨卡托坐标转百度经纬度坐标：
var MCBAND = [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0]
var MC2LL = [
    [1.410526172116255e-8, 0.00000898305509648872, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 17337981.2],
    [-7.435856389565537e-9, 0.000008983055097726239, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 10260144.86],
    [-3.030883460898826e-8, 0.00000898305509983578, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37],
    [-1.981981304930552e-8, 0.000008983055099779535, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06],
    [3.09191371068437e-9, 0.000008983055096812155, 0.00006995724062, 23.10934304144901, -0.00023663490511, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4],
    [2.890871144776878e-9, 0.000008983055095805407, -3.068298e-8, 7.47137025468032, -0.00000353937994, -0.02145144861037, -0.00001234426596, 0.00010322952773, -0.00000323890364, 826088.5]
]
//convertmctobd09({x:12913201.43663225, y:4275272.540245124})
function convertmctobd09(cB) {
    const cC = {
        x: Math.abs(cB.x),
        y: Math.abs(cB.y)
    };
    let cE;
    for (let cD = 0, len = MCBAND.length; cD < len; cD++) {
        if (cC.y >= MCBAND[cD]) {
            cE = MC2LL[cD];
            break;
        }
    }
    const T = convertor(cB, cE);
    return T;
}

function convertor(cC, cD) {
    if (!cC || !cD) {
        return null;
    }
    let T = cD[0] + cD[1] * Math.abs(cC.x);
    const cB = Math.abs(cC.y) / cD[9];
    let cE = cD[2] + cD[3] * cB + cD[4] * cB * cB +
        cD[5] * cB * cB * cB + cD[6] * cB * cB * cB * cB +
        cD[7] * cB * cB * cB * cB * cB +
        cD[8] * cB * cB * cB * cB * cB * cB;
    T *= (cC.x < 0 ? -1 : 1);
    cE *= (cC.y < 0 ? -1 : 1);
    return [T, cE];
}


//（7）经纬度坐标转墨卡托坐标（不太精确）未验证：
function lonlatTomercator(lonlat) {
    var mercator = { x: 0, y: 0 };
    var x = lonlat.x * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lonlat.y) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    mercator.x = x;
    mercator.y = y;
    return mercator;
}

//（8）墨卡托坐标转经纬度坐标（不太精确）未验证：
function mercatorTolonlat(mercator) {
    var lonlat = { x: 0, y: 0 };
    var x = mercator.x / 20037508.34 * 180;
    var y = mercator.y / 20037508.34 * 180;
    y = 180 / Math.PI * (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2);
    lonlat.x = x;
    lonlat.y = y;
    return lonlat;
}

//参考文章：https://blog.csdn.net/weixin_41234005/article/details/134553452