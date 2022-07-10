const PersonGenerator = {
  title: "Dr;Mr;Miss;Mrs;Ms;Sir;Lady",
  firstname:
    "Bob;Robert;Rob;Jane;Fred;Joe;Jenny;Rick;Dave;Cheri;Carole;Sally;Anne;Hanna;Amy;Wendy;Thanh;Gemma;Gillian;Afzal;Damien;Darren;Nick;Nik;Peter;Pierre;Melinda;Bill;William;Billy;Wilma;Barney;Mix;Mini;James;Jim;Jimmy;Colin;Coleen;Roberta;Joanne;Joseph;Joe;Dawn;Donna;Dillon;Charles;Charlie;Charlotte;",
  middlename:
    "Bob;Robert;Rob;Jane;Fred;Joe;Jenny;Rick;Dave;Cheri;Carole;Sally;Anne;Hanna;Amy;Wendy;Thanh;Gemma;Gillian;Afzal;Damien;Darren;Nick;Nik;Peter;Pierre;Melinda;Bill;William;Billy;Wilma;Barney;Mix;Mini;James;Jim;Jimmy;Colin;Coleen;Roberta;Joanne;Joseph;Joe;Dawn;Donna;Dillon;Charles;Charlie;Charlotte;",
  lastname:
    "Smith;Brown;Jones;Robertson;Mctavish;Smithson;Ames;Wilson;Holmes;Watson;MacDonald;Owen;East;North;South;West;Williams;Tyler;Benson;Dobson;",
  fullname: "[title] [firstname] [middlename] [lastname]",
};

const PlaceGenerator = {
  address: "[house], [street] [streettype], [place], [state] [postcode]",
  state: "WA;SA;NSW;VIC;NT;TAS;ACT;QLD;",
  postcode: "1000;2000;3000;4000;5000;6000;7000;",
  street:
    "Strawberry;Juniper;Blackberry;Carlton;Tall;Short;Narrow;Bradbury;Iceberg;Titanic;Elizabeth;Wide;Closed;Deadend;Cliffe;Jupiter;Saturn;Mars;Mercury;Venus;Luna;Pluto;Neptune;",
  place:
    "Success;Hilarys;Carwoola;Kiara;Piara;Armidale;Coogee;North Beach;South Beach;Rockingham;Mandurah;Bunury;Collie;Ashfield;Northam;Redfern;Coobelup;Daisy;Poppy;Oaktree;Sycamore;Skylark;Bluebird;Pigeon;Seagull;Harbourside;",
  streettype:
    "Road;Street;Way;Close;Pass;Highway;Parade;Loop;Avenue;Boulevard;Crescent;",
  house: "1;2;3;4;5;6;7;8;9;10;101;305;32a;32b;32c;",
};

const DateTimeGenerator = {
  day: "1>28",
  month: "1>12",
  year: "1970>2021",
  hour: "0>23",
  minute: "0>59",
  second: "0>59",
  dbdate: "[year]-[month]-[day]",
  date: "[day]/[month]/[year]",
  usdate: "[month]/[day]/[year]",
  time: "[hour]:[minute]:[second]",
  timestamp: "[timestamp]",
  dob: "[day]/[month]/[year]",
  now: "[time]",
  today: "[date]",
};

const InternetGenerators = {
  uuid: "uuid",
  positive_byte: ["1>255"],
  byte: ["0>255"],
  hex_digit: "0;1;2;3;4;5;6;7;8;9;A;B;C;D;E;F;",
  hex: "[hex_digit][hex_digit]",
  mac_address: "[hex]:[hex]:[hex]:[hex]:[hex]:[hex]",
  ipaddress: "[positive_byte].[byte].[byte].[byte]",
  ipv6address:
    "[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]:[hex][hex]",
  server: "gmail;outlook;yahoo;microsoft;",
  tld: "net;com;gov;org;co.uk;com.au;net.au;wa.gov.au;nsw.gov.au;",
};

const CompanyGenerators = {
  department: "hr;finance;it;exec",
  organisation_name:
    "Mega Corp;Uber;WestBank;Facebook;Instagram;Woodside;Tesla;Ford;Toyota;Hyundai;Subaru;Jeep;BP;Caltex;UNSW;UWA;Curtin University;ECU;Murdoch;Baskin Robbins;Coles;Woolworths;BigW;Target;Red Dot;IBM;Google;Microsoft;Amazon;eBay;Celestron;Binaree;Geeks Rool;Horizon Power;Westpac;AMP;Colonial;",
};

const MetricGenerators = {
  length: "10>100",
  height: "10>100",
  depth: "10>100",
  volume: "100>2000",
  weight: "20>200",
};

const StandardGenerators = {
  ...PersonGenerator,
  ...PlaceGenerator,
  ...DateTimeGenerator,
  ...InternetGenerators,
  ...CompanyGenerators,
  ...MetricGenerators,
};

export default StandardGenerators;
