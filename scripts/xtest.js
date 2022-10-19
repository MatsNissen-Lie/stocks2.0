// const test_min_dato = async () =>{
//     const data = await read_file('TSLA')
//     const min = data['1day']
//     // console.log(min)
//     const start_date = datetime_to_index(min, '2020-03-25 16:00', false, false)
//     console.log(min[start_date].datetime)
// }
// test_min_dato()

const parallell = async () =>{
    const data = await hent_data(focuz, '2021-10-01', '2022-01-01', '1min', 250)
    // const data = await hent_data(['TSLA'], '2010-01-01', '2022-01-01', '1day', 250)
    console.log(data)
    let arr_data = {}
    Object.keys(data).forEach(key=>{
        console.log(key,data[key].values.length)
        arr_data[key] = data[key].values
    })
    const keys = Object.keys(data)
    for (let i = 0; i < data['TSLA'].values.length; i++) {
        let sameDate = true
        let last_date = arr_data[keys[0]][i].datetime
        for (let k = 1; k < keys.length; k++) {
            const dato = arr_data[keys[k]][i].datetime
            if (dato !== last_date) sameDate = false, console.log(keys[k] + ' Ikke lik dato')
            last_date = dato
        }
        if(!sameDate){
            keys.forEach(key=>{
                console.log(key+'––––––––')
                // console.log(arr_data[key][i-1].datetime)
                console.log(arr_data[key][i].datetime)
                console.log(arr_data[key][i+1].datetime)
                console.log(arr_data[key][i+2].datetime)
            })
            break
        }
    }
}

// parallell()

const play_with_bollinger = async () =>{
    // const response = await hent_data(['NDX'], '2022-01-01', '2022-02-01', '1day', 20)
    // const meta = response['NDX'].meta
    // const data = response['NDX'].values
    await vis_aksje()
    const meta = chart_data.meta
    const data = chart_data.values
    const bollinger = bollingerBands(data, meta.index, 20,2)
    const bands_lst = bollinger.bands
    const SD_lst = bollinger.SD
    BB_datasets(bollinger.bands,20)
    makeChart()

    strat = {
        over_bands: 0.01,
        under_bands: 0.01
    }
    const EMA = ema(data, meta.index, 20, 2)
    let invested = false
    let transactions = []
    let PF = []
    let currentValue
    for (let i = meta.index; i < data.length; i++) {
        const TD = data[i]
        if(i == meta.index){
            currentValue = TD.close
            invested = true
            transactions.push(transaction_obj(TD.datetime, TD.close, 'buy'))
            continue
        }
        const bands = bands_lst[i-meta.index-1] 
        const SD = SD_lst[i-meta.index-1]
        if(invested){
            const volitilit = (bands[1]+SD)/bands[1]
            if(TD.high > strat.over_bands*bands[2]*volitilit ) 1
        } else if(!invested){
            1
        }
        PF.push(currentValue)
    }
}
// concat er en funksjon. Den returnere en ny liste, men push legger til en eksisterende liste.

// console.log('test––––––––––––––')

//strategier for weekly.
// ny strat. hvis jeg har vært under i to uker og kursen var godt over 1-2% for tre uker siden, kjøp.
// weekIndex = datetime_to_index(weeklyData.EMA, data.datetime, false, false)-1 // må se på forrige uken som, bby
// const lastWeek = weeklyData.values[weekIndex]
// const twoWeekAgo = weeklyData.values[weekIndex-1]

// const lastWeekEMA = weeklyData.EMA[weekIndex]
// const twoWeekAgoEMA = weeklyData.EMA[weekIndex-1]
// if(data.low < lastWeekEMA.close && onsketPris == null){ //twoWeekAgo.close > twoWeekAgoEMA.close*1.015 && lastWeek.low < lastWeekEMA.close && strat.symbol != 'Resesjon'
    // console.log('Over for 3 uke siden. Under de siste to ukene') //problemet er algoritmen ofte selger dagen derpå.
    // console.log(data.datetime)
    // console.log('––––––––––––––––')
    // onsketPris = lastWeekEMA.close
// }

// hent data greier
// const weekly = await hent_data([symbol], start_date, end_date, '1week', 102)
// const weekVal = weekly[symbol].values
// const weekEMA = ema(weekVal, 100, 100, 2)
// const weeekdata = {
//     EMA: weekEMA,
//     values: weekVal.slice(-weekEMA.length)
// }