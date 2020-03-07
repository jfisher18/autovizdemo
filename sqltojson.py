import sqlite3
import json
import copy

# ERROR WITH FIRST POINT?

dbname = "OilPrices"
save = {
    "query": "",
    "start": 0,
    "stop": 0,
    "step": 0,
    "encoding": "",
    "gmax": 0,
    "gmin": 0,
    "xname": "",
    "yname": "",
    "data": []
}
conn = sqlite3.connect("dbs/{}/{}Bad.db".format(dbname, dbname))
c = conn.cursor()


c.execute("SELECT * FROM {}_info".format(dbname))
info = c.fetchone()
save['query'] = info[0]
save['start'] = info[1]
save['stop'] = info[2]
save['step'] = info[3]
save['encoding'] = info[5]

c.execute("SELECT * FROM {}_data LIMIT 1".format(dbname))
xname = c.description[2][0][2:]
save['xname'] = xname
yname = c.description[3][0][2:]
save['yname'] = yname
bps_tuples = c.execute("SELECT * FROM {}_breakpoints".format(dbname))
bps = list(map(lambda x : x[0], bps_tuples))
bps.sort()
bps.append(0)
gmax = None
gmin = None
# if no breakpoints?
for i in range(len(bps)):
    res = ()
    if i == 0:
        res = c.execute("SELECT * FROM {}_data WHERE sliderindex <= ? ORDER BY sliderindex".format(dbname), (bps[i],))
    elif i == len(bps)-1:
        res = c.execute("SELECT * FROM {}_data WHERE sliderindex > ? ORDER BY sliderindex".format(dbname), (bps[i-1],))
    else:
        res = c.execute("SELECT * FROM {}_data WHERE sliderindex <= ? AND sliderindex > ? ORDER BY sliderindex".format(dbname), (bps[i],bps[i-1]))
    # mins = c.fetchone()
    res_l = list(res)
    ydata = list(map(lambda x : x[3], res_l))
    bpmax = max(ydata)
    bpmin = min(ydata)
    if gmax:
        gmax = max(gmax, bpmax)
    else:
        gmax = bpmax
    if gmin:
        gmin = min(gmin, bpmin)
    else:
        gmin = bpmin
    index_data = {"index": None, "query": "", "max": bpmax, "min": bpmin, "records": []}
    for row in res_l:
        if row[0] != index_data['index']:
            if index_data['index']:
                save['data'].append(copy.copy(index_data))
            index_data['index'] = row[0]
            index_data['query'] = row[1]
            index_data['records'] = []
        index_data['records'].append({xname: row[2], yname: row[3]})
    save['data'].append(copy.copy(index_data))
save['gmax'] = gmax
save['gmin'] = gmin
conn.close()
json_file = open("dbs/{}/config.json".format(dbname, dbname), "w")
json_file.write(json.dumps(save, indent=4, separators=(',', ': ')))
json_file.close()
