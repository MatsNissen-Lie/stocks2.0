//globale funksjoner
const focuz = ["AAPL", "MSFT", "NDX", "TSLA", "GOOGL"];
const smart_trending_comparison = ["AAPL", "MSFT", "GOOGL", "NDX", "TSLA"];
const trending_comparison = ["AAPL", "MSFT", "GOOGL"];
// const trending_comparison = ['AAPL', 'MSFT', 'GOOGL', 'TSLA']

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const dagsDato = (dato) => {
  return new Date(dato).toISOString().split("T")[0];
};
const round = (tall, desimaler) => {
  n = 10 ** desimaler;
  avrundet = Math.round(tall * n) / n;
  return avrundet;
};

const datetime_to_index = (
  data,
  date,
  find_nearest = true,
  else_find_greater = true
) => {
  let start = 0;
  let end = data.length - 1;
  while (start <= end) {
    let middle = Math.floor((start + end) / 2);

    if (data[middle].datetime === date) {
      return middle; // found the date
    } else if (data[middle].datetime < date) {
      start = middle + 1; // continue searching to the right
    } else {
      end = middle - 1; // search searching to the left
    }
  }
  if (end === -1) end += 1;
  if (start === data.length) start += -1;
  const nearest = [
    [data[end].datetime, end],
    [data[start].datetime, start],
  ];
  // console.log(nearest[0][0], nearest[1][0])
  nearest.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()); //sorterer kronologisk
  // console.log(nearest)
  if (find_nearest) {
    const timestamp = new Date(date).getTime();
    if (
      Math.abs(
        timestamp - new Date(nearest[0][0]) !=
          Math.abs(timestamp - new Date(nearest[1][0]))
      )
    ) {
      if (
        Math.abs(
          timestamp - new Date(nearest[0][0]) >
            Math.abs(timestamp - new Date(nearest[1][0]))
        )
      )
        return nearest[1][1];
      else return nearest[0][1];
    }
  }
  if (else_find_greater) return nearest[1][1];
  else return nearest[0][1];
};
const slice_datoer = (data_arr, start_date, end_date, preData = 0) => {
  const start_index =
    datetime_to_index(data_arr, start_date, false, true) - preData; //henter fra og med dato
  if (start_index < 0) return -1;
  const slutt_index = datetime_to_index(
    data_arr,
    end_date + " 16:00:00",
    false,
    false
  ); //henter til og med dato.
  const data = data_arr.slice(start_index, slutt_index + 1); //+1 <=> til og med
  return data; //{SI: start_index, values: data}
};
const check_parallell = (data_obj) => {
  lengths = [];
  Object.keuys(data_obj).forEach((key) => {
    lengths.push(data_obj[key].values.length);
  });
  return lengths.every((val, i, arr) => val === arr[0]);
};
const grouo_dayTrads = (trads) => {
  let tradObj = {};
  trads.forEach((trad) => {
    const dato = dagsDato(trad.datetime);
    if (dato in tradObj) {
      tradObj[dato].push(trad);
    } else tradObj[dato] = [trad];
  });
  return tradObj;
};

const isUSMarketOpen = () => {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const totalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (
    9.5 * 60 <= totalMin &&
    totalMin < 16 * 60 &&
    now.getUTCDay() >= 1 &&
    now.getUTCDay() <= 5
  );
};
const markedIsOpen = () => {
  return isUSMarketOpen();
  const markedOpeningTime = 15;
  const markedClosingTime = 22;

  let marketOpen = false;
  const day = new Date().getDay();
  const timer = new Date().getHours();
  const minutter = new Date().getMinutes();
  const totalMin = timer * 60 + minutter;
  if (
    markedOpeningTime * 60 + 30 <= totalMin &&
    totalMin <= markedClosingTime * 60 &&
    day !== 0 &&
    day !== 6
  )
    marketOpen = true;
  return marketOpen;
};
module.exports = markedIsOpen;

// let list_of_dates = []
// let timeStamp = new Date().getTime() - 30*24*3600*1000
// for (let i = 0; i < 30; i++) {
//     list_of_dates.push({datetime: new Date(timeStamp).toISOString().split('T')[0]})
//     timeStamp += 24*3600*1000
// }
// list_of_dates.splice(20,2)
// list_of_dates.splice(18,1)
// console.log(list_of_dates)
// console.log(datetime_to_index(list_of_dates, '2021-12-11 12:00', true, true))
