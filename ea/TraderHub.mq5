//+------------------------------------------------------------------+
//|                                                    TraderHub.mq5 |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//|                                        https://www.TraderHub.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, TraderHub Ltd."
#property link      "https://www.TraderHub.com"
#property version   "1.00"
//==================================================
// 
//==================================================

#property version   "1.00"
#define FH_SIGNAL_BG    "FH_SIGNAL_BG"
#define FH_SIGNAL_TEXT  "FH_SIGNAL_TEXT"
#define FH_WARN_BG      "FH_WARN_BG"
#define FH_WARN_TITLE   "FH_WARN_TITLE"
#define FH_WARN_LINE1   "FH_WARN_LINE1"
#define FH_WARN_LINE2   "FH_WARN_LINE2"
#define FH_WARN_LINE3   "FH_WARN_LINE3"

input string ServerURL      = "http://127.0.0.1:3000";
input string AccountToken = "FH-249420-DEV-001";
input string MagicSuffix    = ""; //MagicNomber
input bool   EnableLog      = true;
input int    Heartbeat      = 5;

string nameEA = "TraderHub EA V1.0";
//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------
long MagicNumber;
string AccountNumber;
string AccountName;
string ServerName;
datetime LastHeartbeat = 0;
datetime LastMasterOpenTime = 0;

datetime timeDate = D'2026.08.01 00:00';
int expiredDays = 100;
int noAccount = 223038;
int ticket,seri = 1;
string  namaAkun = "";

bool IsExpired() {
datetime expiredTime = timeDate + (expiredDays * 86400);
//if (TimeCurrent() >= expiredTime || AccountInfoInteger(ACCOUNT_LOGIN) != noAccount) return true;
   if (TimeCurrent() >= expiredTime) return true;
return false;
}
//==============================================================
int OnInit()
{
   AccountNumber = IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
   AccountName   = AccountInfoString(ACCOUNT_NAME);
   ServerName    = AccountInfoString(ACCOUNT_SERVER);

   if(StringLen(MagicSuffix)==0)
      MagicNumber = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   else
      MagicNumber = StringToInteger(AccountNumber + MagicSuffix);

   Status.connected = false;
   Status.activated = false;
   Status.status = "";
   Status.heartbeat = Heartbeat;
   Status.message   = "Connecting...";
   Status.connectAttempts = 0;
   Status.connectBlockedUntil = 0;

   if(Heartbeat < 5) EventSetTimer(5);
   else EventSetTimer(Heartbeat);
   UpdateChartDashboard();
   
   
   //if(!IsExpired()) {}
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   HideSignalNotification();
    EventKillTimer();
    Disconnect();
    ObjectsDeleteAll(0, "FH_Dash_Line_");
}
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
void OnTradeTransaction(
   const MqlTradeTransaction& trans,
   const MqlTradeRequest& request,
   const MqlTradeResult& result)
{
   if(!Status.activated || !Status.connected)
      return;
      if(Status.status != "MASTER")
      return;
   SendTradeEvent(trans);
   
}
//========================================
struct EAStatus
{
   bool connected;
   bool activated;
   string status;
   string message;
   int heartbeat;
   int connectAttempts;
   int followerCount;
   datetime connectBlockedUntil;
   datetime lastHeartbeat;
};
EAStatus Status;
//============================

void SendPosition(const MqlTradeTransaction &trans)
{
   if(!PositionSelectByTicket(trans.position))
      return;

   long tickett      = PositionGetInteger(POSITION_TICKET);
   string symbol    = PositionGetString(POSITION_SYMBOL);
   ENUM_POSITION_TYPE type =
      (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
   string action = "BUY";
   if(type==POSITION_TYPE_SELL) action="SELL";
   double volume    = PositionGetDouble(POSITION_VOLUME);
   double price     = PositionGetDouble(POSITION_PRICE_OPEN);
   double sl        = PositionGetDouble(POSITION_SL);
   double tp        = PositionGetDouble(POSITION_TP);
   long magic       = PositionGetInteger(POSITION_MAGIC);
   string comment   = PositionGetString(POSITION_COMMENT);

   string json =
      StringFormat(
      "{"
      "\"account_number\":\"%s\","
      "\"account_token\":\"%s\","
      "\"event\":\"MODIFY\","
      "\"ticket\":%I64d,"
      "\"symbol\":\"%s\","
      "\"action\":\"%s\","
      "\"volume\":%.2f,"
      "\"price\":%.5f,"
      "\"sl\":%.5f,"
      "\"tp\":%.5f,"
      "\"magic\":%I64d,"
      "\"comment\":\"%s\""
      "}",

      AccountNumber,
      AccountToken,
      tickett,
      symbol,
      action,
      volume,
      price,
      sl,
      tp,
      magic,
      comment
      );
   string response;
   HttpPost("/api/ea/trade",json,response);
}

//===================================================

void SendDeal(const MqlTradeTransaction &trans)
{
   if(!HistoryDealSelect(trans.deal))
      return;

   long tiicket      = (long)HistoryDealGetInteger(trans.deal, DEAL_POSITION_ID);
   long deal        = (long)HistoryDealGetInteger(trans.deal, DEAL_TICKET);
   string symbol    = HistoryDealGetString(trans.deal, DEAL_SYMBOL);
   double volume    = HistoryDealGetDouble(trans.deal, DEAL_VOLUME);
   double price     = HistoryDealGetDouble(trans.deal, DEAL_PRICE);
   double profit    = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
   double swap      = HistoryDealGetDouble(trans.deal, DEAL_SWAP);
   double commission= HistoryDealGetDouble(trans.deal, DEAL_COMMISSION);
   long magic       = HistoryDealGetInteger(trans.deal, DEAL_MAGIC);
   string comment   = HistoryDealGetString(trans.deal, DEAL_COMMENT);

   ENUM_DEAL_ENTRY entry =
      (ENUM_DEAL_ENTRY)HistoryDealGetInteger(trans.deal, DEAL_ENTRY);
   ENUM_DEAL_TYPE type =
      (ENUM_DEAL_TYPE)HistoryDealGetInteger(trans.deal, DEAL_TYPE);

   string action = "";
   if(type==DEAL_TYPE_BUY) action="BUY";
   else if(type==DEAL_TYPE_SELL) action="SELL";
   else return;

   string event="";
   if(entry==DEAL_ENTRY_IN) event="OPEN";
   if(entry==DEAL_ENTRY_OUT) event="CLOSE";
   if(event=="") return;
   
   if(Status.status == "MASTER" && event == "OPEN") {
      CheckMasterRapidOpen();
   }

   string json = StringFormat(
      "{"
      "\"account_number\":\"%s\","
      "\"account_token\":\"%s\","
      "\"event\":\"%s\","
      "\"ticket\":%I64d,"
      "\"deal\":%I64d,"
      "\"symbol\":\"%s\","
      "\"action\":\"%s\","
      "\"volume\":%.2f,"
      "\"price\":%.5f,"
      "\"profit\":%.2f,"
      "\"swap\":%.2f,"
      "\"commission\":%.2f,"
      "\"magic\":%I64d,"
      "\"comment\":\"%s\""
      "}",

      AccountNumber,
      AccountToken,
      event,
      tiicket,
      deal,
      symbol,
      action,
      volume,
      price,
      profit,
      swap,
      commission,
      magic,
      comment
   );
   string response;
   HttpPost("/api/ea/trade",json,response);
}
//=============================================================

void SendPending(const MqlTradeTransaction &trans)
{
   if(!OrderSelect(trans.order))
      return;

   string event = "";
   switch(trans.type)
   {
      case TRADE_TRANSACTION_ORDER_ADD:
         event = "PENDING_ADD";
         break;
      case TRADE_TRANSACTION_ORDER_UPDATE:
         event = "PENDING_UPDATE";
         break;
      case TRADE_TRANSACTION_ORDER_DELETE:
         event = "PENDING_DELETE";
         break;
      default:
         return;
   }

   long tticket = OrderGetInteger(ORDER_TICKET);
   string symbol = OrderGetString(ORDER_SYMBOL);
   ENUM_ORDER_TYPE type =
      (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);
   string action = EnumToString(type);
   double volume = OrderGetDouble(ORDER_VOLUME_INITIAL);
   double price = OrderGetDouble(ORDER_PRICE_OPEN);
   double sl = OrderGetDouble(ORDER_SL);
   double tp = OrderGetDouble(ORDER_TP);
   long magic = OrderGetInteger(ORDER_MAGIC);
   string comment = OrderGetString(ORDER_COMMENT);
   string json = StringFormat(
      "{"
      "\"account_number\":\"%s\","
      "\"account_token\":\"%s\","
      "\"event\":\"%s\","
      "\"ticket\":%I64d,"
      "\"symbol\":\"%s\","
      "\"action\":\"%s\","
      "\"volume\":%.2f,"
      "\"price\":%.5f,"
      "\"sl\":%.5f,"
      "\"tp\":%.5f,"
      "\"magic\":%I64d,"
      "\"comment\":\"%s\""
      "}",

      AccountNumber,
      AccountToken,
      event,
      tticket,
      symbol,
      action,
      volume,
      price,
      sl,
      tp,
      magic,
      comment
   );

   string response;
   HttpPost("/api/ea/trade", json, response);
}
//====================================================

void SendTradeEvent(const MqlTradeTransaction &trans)
{
   switch(trans.type)
   {
      case TRADE_TRANSACTION_DEAL_ADD:
         SendDeal(trans);
         break;

      case TRADE_TRANSACTION_POSITION:
         SendPosition(trans);
         break;

      case TRADE_TRANSACTION_ORDER_ADD:
      case TRADE_TRANSACTION_ORDER_UPDATE:
      case TRADE_TRANSACTION_ORDER_DELETE:
         SendPending(trans);
         break;
   }
}
//============================================

string BuildTradeJson(const MqlTradeTransaction &trans,string event)
{
   return StringFormat(
      "{"
      "\"account_number\":\"%s\","
      "\"event\":\"%s\","
      "\"ticket\":%I64d,"
      "\"deal\":%I64d,"
      "\"position\":%I64d,"
      "\"order\":%I64d,"
      "\"symbol\":\"%s\""
      "}",

      AccountNumber,
      event,
      trans.position,
      trans.deal,
      trans.position,
      trans.order,
      trans.symbol
   );
}
//====================================
bool HttpPost(string endpoint, string json, string &response)
{
   string url = ServerURL + endpoint;

   char data[];
   char result[];
   string result_headers;

   ResetLastError();
   StringToCharArray(json, data, 0, StringLen(json));

   string headers = "Content-Type: application/json\r\n";

   int code = WebRequest(
      "POST",
      url,
      headers,
      5000,
      data,
      result,
      result_headers
   );

   int error = GetLastError();

   if(code == -1) {
      return false;
   }
   response = CharArrayToString(result);
   return true;
}
//====================================
void ParseConnect(string response)
{
   Status.connected =
      (StringFind(response,"\"connected\":true") >= 0);
   Status.activated =
      (StringFind(response,"\"activated\":true") >= 0);
   int pos = StringFind(response,"\"heartbeat\":");
   if(pos >= 0)
   {
      string s = StringSubstr(response,pos + 12);
      Status.heartbeat = (int)StringToInteger(s);
   }
   pos = StringFind(response,"\"status\":\"");
   if(pos >= 0)
   {
      string s = StringSubstr(response,pos + 10);
      int end = StringFind(s,"\"");

      if(end > 0)
         Status.status = StringSubstr(s,0,end);
   }
   pos = StringFind(response,"\"message\":\"");

   if(pos >= 0)
   {
      string s = StringSubstr(response,pos + 11);
      int end = StringFind(s,"\"");

      if(end > 0)
         Status.message = StringSubstr(s,0,end);
   }

   if(!Status.connected || !Status.activated)
   {
      if(Status.message == "")
         Status.message = "Connection rejected.";
   }
   
   int poss = StringFind(response, "\"follower_count\":");
   if(poss >= 0) {
      string value = StringSubstr(response, poss + 17);
      int end = StringFind(value, ",");
      if(end >= 0) value = StringSubstr(value, 0, end);
      Status.followerCount = (int)StringToInteger(value);
   }

   UpdateChartDashboard();
}
//=====================================================

string BuildConnectJson()
{
   return StringFormat(
      "{\"account_number\":\"%s\","
      "\"account_name\":\"%s\","
      "\"server_name\":\"%s\","
      "\"magic\":%I64d,"
      "\"account_token\":\"%s\","
      "\"status\":\"UNKNOWN\""
      "}",
      AccountNumber,
      AccountName,
      ServerName,
      MagicNumber,
      AccountToken
   );
}
//===========================================
void Connect()
{
   if(Status.connectAttempts >= 5) {
      Status.connectBlockedUntil = TimeCurrent() + 3600;
      Status.message = "Connection failed. Retry after 1 hour.";
      UpdateChartDashboard();
      Print(Status.message);
      return;
   }
   Status.connectAttempts++;
   Print("Connect attempt ", Status.connectAttempts, "/5");

   string response;
   if(!HttpPost("/api/ea/connect", BuildConnectJson(), response)) {
      Status.message = "Connect request failed.";
      UpdateChartDashboard();
      return;
   }
   Print("Connect Response: [", response, "]");

   if(StringLen(response) == 0) {
      Status.message = "Empty server response.";
      UpdateChartDashboard();
      return;
   }

   ParseConnect(response);

   if(Status.connected && Status.activated) {
      Status.connectAttempts = 0;
      if(Status.status == "MASTER") {
         HideSignalNotification();
      } else if(Status.status == "FOLLOWER") {
         ShowSignalWaiting();
      }
      Print("EA connected successfully. Role: ", Status.status);
   }
   
}

//==========================

string BuildHeartbeatJson()
{
   // point/digits/bid/ask are for _Symbol (this EA's own chart symbol - the
   // only symbol OPEN_BUY/OPEN_SELL ever trades). Sent so the dashboard can
   // convert a pip value into an actual price correctly instead of guessing
   // a pip size, which differs per symbol/broker.
   // "platform" is a literal "MT5" here - this file only ever runs inside
   // MetaTrader 5 (it uses MT5-only APIs like MqlTradeRequest). Sending it
   // explicitly instead of the dashboard hardcoding "MT5" means that once a
   // TraderHub.mq4 (MT4) build exists and sends "platform":"MT4" instead,
   // the backend/frontend need zero changes to display it correctly.
   return StringFormat(
      "{\"account_number\":\"%s\","
      "\"account_token\":\"%s\","
      "\"balance\":%.2f,"
      "\"equity\":%.2f,"
      "\"broker\":\"%s\","
      "\"terminal_build\":%d,"
      "\"platform\":\"MT5\","
      "\"symbol\":\"%s\","
      "\"point\":%.10f,"
      "\"digits\":%d,"
      "\"bid\":%.5f,"
      "\"ask\":%.5f,"
      "\"positions\":%s}",

      AccountNumber,
      AccountToken,
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      AccountInfoString(ACCOUNT_COMPANY),
      (int)TerminalInfoInteger(TERMINAL_BUILD),
      _Symbol,
      SymbolInfoDouble(_Symbol, SYMBOL_POINT),
      (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS),
      SymbolInfoDouble(_Symbol, SYMBOL_BID),
      SymbolInfoDouble(_Symbol, SYMBOL_ASK),
      BuildPositionsJson()
   );
}

// Snapshot of every position currently open on this MT5 account. Sent with
// every heartbeat so the server can reconcile its "trades" table against
// reality - any RUNNING row whose ticket is missing from this list gets
// marked CLOSED, fixing rows that got stuck open because an OPEN/CLOSE
// event was missed (EA offline, manual close, etc).
string BuildPositionsJson()
{
   string json = "[";
   int total = PositionsTotal();
   bool first = true;

   for(int i = 0; i < total; i++) {
      ulong tickett = PositionGetTicket(i);
      if(tickett == 0) continue;
      if(!PositionSelectByTicket(tickett)) continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      ENUM_POSITION_TYPE type =
         (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      string action = (type == POSITION_TYPE_SELL) ? "SELL" : "BUY";
      double volume  = PositionGetDouble(POSITION_VOLUME);
      double price   = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl      = PositionGetDouble(POSITION_SL);
      double tp      = PositionGetDouble(POSITION_TP);
      double curPrice= PositionGetDouble(POSITION_PRICE_CURRENT);
      double profit  = PositionGetDouble(POSITION_PROFIT);
      double swap    = PositionGetDouble(POSITION_SWAP);
      long openTime  = (long)PositionGetInteger(POSITION_TIME);

      if(!first) json += ",";
      first = false;

      json += StringFormat(
         "{\"ticket\":%I64d,\"symbol\":\"%s\",\"action\":\"%s\","
         "\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,"
         "\"current_price\":%.5f,\"profit\":%.2f,\"swap\":%.2f,"
         "\"open_time\":%I64d}",
         tickett, symbol, action, volume, price, sl, tp,
         curPrice, profit, swap, openTime
      );
   }

   json += "]";
   return json;
}
//========================================
void HeartbeatEA()
{
   string response;
   if(!HttpPost("/api/ea/heartbeat", BuildHeartbeatJson(), response)) {
      Print("Heartbeat failed.");
      return;
   }
   ParseHeartbeat(response);
}
//=======================================
void ParseHeartbeat(string response)
{
   bool serverActivated =
      (StringFind(response, "\"activated\":true") >= 0);
   bool serverConnected =
      (StringFind(response, "\"connected\":true") >= 0);

   if(!serverConnected) {
      Status.message = "Server rejected connection.";
      Status.activated = false;
      Status.connected = false;
      UpdateChartDashboard();
      return;
   }
   Status.activated = serverActivated;
   int pos = StringFind(response, "\"heartbeat\":");
   if(pos >= 0) {
      string s = StringSubstr(response, pos + 12);
      int value = (int)StringToInteger(s);

      if(value > 0)
         Status.heartbeat = value;
   }

   pos = StringFind(response, "\"status\":\"");
   if(pos >= 0) {
      string s = StringSubstr(response, pos + 10);
      int end = StringFind(s, "\"");
      if(end > 0)
         Status.status = StringSubstr(s, 0, end);
   }

   pos = StringFind(response, "\"message\":\"");
   if(pos >= 0) {
      string s = StringSubstr(response, pos + 11);
      int end = StringFind(s, "\"");

      if(end > 0)
         Status.message = StringSubstr(s, 0, end);
   }
   if(!Status.activated) {
      Status.message = "EA Disabled by Server.";
   }

   UpdateChartDashboard();

   if(Status.activated && Status.heartbeat > 0) {
      EventKillTimer();
      EventSetTimer(Status.heartbeat);
   }
   
   
   int poss = StringFind(response, "\"follower_count\":");
    if(poss >= 0) {
      string value = StringSubstr(response, poss + 17);
      int end = StringFind(value, ",");
      if(end >= 0) value = StringSubstr(value, 0, end);
      Status.followerCount = (int)StringToInteger(value);
   }
   
   ExecuteCommand(response);

   if(Status.status == "FOLLOWER") {
      ExecuteSignal(response);
   }
}

//=========================================
void OnTimer()
{
   if(!Status.connected) {
      if(Status.connectBlockedUntil > TimeCurrent())
         return;
      Connect();
      return;
   }
   HeartbeatEA();
}
//==========================================
void ExecuteSignal(string response)
{
   int signalsPos = StringFind(response, "\"signals\":");
   if(signalsPos < 0) return;
   string signals = StringSubstr(response, signalsPos);
   if(StringFind(signals, "[]") == 0) return;

   // ID delivery
   int idPos = StringFind(signals, "\"id\":");
   if(idPos < 0) return;
   string idText = StringSubstr(signals, idPos + 5);
   int idEnd = StringFind(idText, ",");
   if(idEnd < 0) return;
   long signalDeliveryId = (long)StringToInteger(StringSubstr(idText, 0, idEnd));

   // Symbol
   int symbolPos = StringFind(signals, "\"symbol\":\"");
   if(symbolPos < 0) return;
   string symbolText = StringSubstr(signals, symbolPos + 10);
   int symbolEnd = StringFind(symbolText, "\"");
   if(symbolEnd < 0) return;
   string symbol = StringSubstr(symbolText, 0, symbolEnd);

   // Type
   int typePos = StringFind(signals, "\"type\":\"");
   if(typePos < 0) return;
   string typeText = StringSubstr(signals, typePos + 8);
   int typeEnd = StringFind(typeText, "\"");
   if(typeEnd < 0) return;
   string type = StringSubstr(typeText, 0, typeEnd);

   // Action
   int actionPos = StringFind(signals, "\"action\":\"");

   string action = "";
   if(actionPos >= 0) {
      string actionText = StringSubstr(signals, actionPos + 10);
      int actionEnd = StringFind(actionText,  "\"");

      if(actionEnd >= 0) {
         action = StringSubstr(actionText, 0,actionEnd);
      }
   }
   // Price From
   double priceFrom = GetJsonDouble(signals, "\"price_from\":");
   // Price To
   double priceTo = GetJsonDouble(signals, "\"price_to\":");
   // SL
   double sl = GetJsonDouble(signals,"\"sl\":");
   // TP
   double tp = GetJsonDouble(signals, "\"tp\":");

   string signalTime = TimeToString(TimeCurrent(), TIME_SECONDS);

   Print(
      "SIGNAL RECEIVED | ID=",
      signalDeliveryId,
      " Type=",
      type,
      " Symbol=",
      symbol,
      " Action=",
      action
   );

   ShowSignal(
      signalTime,
      type,
      priceFrom,
      priceTo,
      sl,
      tp
   );

   PlaySound("alert.wav");

   // nanti setelah signal benar-benar diterima
   // kita ACK ke server
}
//========================================
double GetJsonDouble(string json, string key)
{
   int pos = StringFind(json, key);
   if(pos < 0) return 0.0;
   string value = StringSubstr(json, pos + StringLen(key));

   int end = StringFind(value, ",");
   if(end < 0)
      end = StringFind(value, "}");
   if(end >= 0) {\value = StringSubstr(\value, 0, end);
   }

   StringTrimLeft(value);
   StringTrimRight(value);

   return StringToDouble(value);
}
//=============================================
void SendSignalAck(long signalId, bool success)
{
   string json = StringFormat(
      "{\"account_number\":\"%s\",\"account_token\":\"%s\","
      "\"signal_id\":%I64d,\"success\":%s}",
      AccountNumber,
      AccountToken,
      signalId,
      success ? "true" : "false"
   );

   string response;

   if(!HttpPost(
      "/api/ea/signal/ack",
      json,
      response))
   {
      Print("Signal ACK failed.");
      return;
   }

   Print("Signal ACK: ", response);
}
//==========================
void ExecuteCommand(string response)
{
   int commandsPos = StringFind(response, "\"commands\":");
   if(commandsPos < 0) return;
   string commands = StringSubstr(response, commandsPos);
   int pos = StringFind(commands, "\"id\":");
   while(pos >= 0) {
      string item = StringSubstr(commands, pos);

      // Ambil command ID
      string idText = StringSubstr(item, 5);
      int idEnd = StringFind(idText, ",");

      if(idEnd < 0) break;

      long commandId =
         (long)StringToInteger(
            StringSubstr(idText, 0, idEnd)
         );

      // Ambil nama command
      int commandPos = StringFind(item, "\"command\":\"");
      if(commandPos < 0) break;

      string commandText = StringSubstr(item, commandPos + 11);
      int commandEnd = StringFind(commandText, "\"");
      if(commandEnd < 0) break;
      string command = StringSubstr(commandText, 0, commandEnd);
      
      string payload = "";
      int payloadPos = StringFind(item, "\"payload\":");
      if(payloadPos >= 0) {
         payload = StringSubstr(item, payloadPos + 10);
         int payloadEnd = StringFind(payload, "}");
         if(payloadEnd >= 0) {
            int start = StringFind(payload, "{");
            int end   = StringFind(payload, "}", start);
            
            if(start >= 0 && end >= start)
            {
               payload = StringSubstr(
                  payload,
                  start,
                  end - start + 1
               );
            }
         }
      } else {
         payload = "";
      }
      Print("Command ID= ", commandId, " Command= ", command, " Payload= ", payload);

      bool success = false;
      string message = "";

      if(command == "CLOSE_ALL") {
         success = ExecuteClose("ALL");
         message = success ? "CLOSE_ALL executed" : "CLOSE_ALL failed";
      } else if(command == "CLOSE_BUY") {
         success = ExecuteClose("BUY");
         message = success ? "CLOSE_BUY executed" : "CLOSE_BUY failed";
      } else if(command == "CLOSE_SELL") {
         success = ExecuteClose("SELL");
         message = success ? "CLOSE_SELL executed" : "CLOSE_SELL failed";
      } else if(command == "CLOSE_PROFIT") {
         success = ExecuteCloseByPnl(true);
         message = success ? "CLOSE_PROFIT executed" : "CLOSE_PROFIT failed";
      } else if(command == "CLOSE_LOSS") {
         success = ExecuteCloseByPnl(false);
         message = success ? "CLOSE_LOSS executed" : "CLOSE_LOSS failed";
      } else if(command == "DELETE_PENDING") {
         success = ExecuteDeletePending();
         message = success ? "DELETE_PENDING executed" : "DELETE_PENDING failed";
      } else if(command == "MODIFY_SL") {
         double value = GetPayloadField(payload, "value");
         success = ExecuteModify("SL", value);
         message = success ? "MODIFY_SL executed" : "MODIFY_SL failed";
      } else if(command == "MODIFY_TP") {
         double value = GetPayloadField(payload, "value");
         success = ExecuteModify("TP", value);
         message = success ? "MODIFY_TP executed" : "MODIFY_TP failed";
      } else if(command == "DELETE_SL") {
         success = ExecuteModify("SL", 0);
         message = success ? "DELETE_SL executed" : "DELETE_SL failed";
      } else if(command == "DELETE_TP") {
         success = ExecuteModify("TP", 0);
         message = success ? "DELETE_TP executed" : "DELETE_TP failed";
      } else if(command == "OPEN_BUY" || command == "OPEN_SELL") {
         double volume = GetPayloadField(payload, "volume");
         double sl     = GetPayloadField(payload, "sl");
         double tp     = GetPayloadField(payload, "tp");
         string mode   = (command == "OPEN_BUY") ? "BUY" : "SELL";
         success = ExecuteOpen(mode, volume, sl, tp);
         message = success ? (command + " executed") : (command + " failed");
      } else {
         message = "Unknown command: " + command;
      }

      SendCommandAck(commandId, success, message);
      // Cari command berikutnya
      int nextPos = StringFind(commands, "\"id\":", pos + 5);
      if(nextPos == pos)  break;
      pos = nextPos;
   }
}
//=============================================
// Reads a numeric field out of an ea_commands payload. Unlike GetJsonDouble
// (used for the "signals" array, which arrives as plain unescaped JSON),
// `payload` here started life as JSON.stringify()'d on the frontend, got
// stored as TEXT, then got embedded as a STRING value inside the heartbeat's
// JSON response - so by the time it reaches the EA its quotes are literally
// backslash-escaped (`\"volume\":0.01`), not the bare `"volume":` GetJsonDouble
// looks for. Searching for the bare key name (no quotes) sidesteps that
// entirely, same trick the original single-field GetPayloadValue already
// relied on for MODIFY_SL/MODIFY_TP's "value" key.
double GetPayloadField(string payload, string key)
{
   int keyPos = StringFind(payload, key);

   if(keyPos < 0) {
      return 0.0;
   }

   int colonPos = StringFind(payload, ":", keyPos);
   if(colonPos < 0) {
      return 0.0;
   }
   string text = StringSubstr(payload, colonPos + 1);
   string number = "";

   int len = StringLen(text);
   for(int i = 0; i < len; i++) {
      ushort c = StringGetCharacter(text, i);

      // angka
      if((c >= '0' && c <= '9') ||
         c == '.' ||
         c == '-')
      {
         number += ShortToString((short)c);
      } else if(StringLen(number) > 0) {
         break;
      }
   }

   if(number == "") return 0.0;
   double value = StringToDouble(number);
   return value;
}
//=============================================
// value == 0 is a deliberate, valid input here - it's how DELETE_SL/DELETE_TP
// clear a level (MT5 treats sl/tp == 0 in TRADE_ACTION_SLTP as "no SL/TP").
// Only negative values (garbage) are rejected.
bool ExecuteModify(string mode, double value)
{
Print("=== EXECUTE MODIFY ENTER ===");
   Print("Mode=", mode, " Value=", value);
   if(value < 0)
      return false;

   bool allSuccess = true;
   int matched = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong tickeet = PositionGetTicket(i);
      if(tickeet == 0) continue;
      if(!PositionSelectByTicket(tickeet)) continue;

      matched++;

      string symbol = PositionGetString(POSITION_SYMBOL);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);

      if(mode == "SL") sl = value;
      else if(mode == "TP") tp = value;
      else return false;

      MqlTradeRequest request = {};
      MqlTradeResult result = {};

      request.action   = TRADE_ACTION_SLTP;
      request.position = tickeet;
      request.symbol   = symbol;
      request.sl       = sl;
      request.tp       = tp;

      ResetLastError();

      if(!OrderSend(request, result)) {
         allSuccess = false;

         Print(
            "MODIFY SEND FAILED | Ticket=", tickeet,
            " | Error=", GetLastError()
         );

         continue;
      }

      if(result.retcode != TRADE_RETCODE_DONE)
         allSuccess = false;
   }

   if(matched == 0) {
      Print("MODIFY FAILED: No open positions found.");
      return false;
   }

   return allSuccess;
}
//=============================================
// Opens a new market order on this EA's own chart symbol (_Symbol) - there's
// no "which symbol" ambiguity to resolve since one EA instance is always
// attached to exactly one chart/symbol, same assumption CLOSE_ALL etc. rely
// on implicitly. sl/tp of 0 means "no SL/TP", matching how ExecuteModify
// already treats 0 as "leave it as-is" elsewhere.
bool ExecuteOpen(string mode, double volume, double sl, double tp)
{
   if(volume <= 0) {
      Print("OPEN failed: volume must be greater than 0.");
      return false;
   }

   double minVol  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxVol  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);

   if(volume < minVol || volume > maxVol) {
      Print(
         "OPEN failed: volume ", volume,
         " outside allowed range [", minVol, ", ", maxVol, "] for ", _Symbol
      );
      return false;
   }

   MqlTradeRequest request = {};
   MqlTradeResult result = {};

   request.action    = TRADE_ACTION_DEAL;
   request.symbol    = _Symbol;
   request.volume    = volume;
   request.magic     = MagicNumber;
   request.deviation = 20;

   if(mode == "BUY") {
      request.type  = ORDER_TYPE_BUY;
      request.price = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   } else if(mode == "SELL") {
      request.type  = ORDER_TYPE_SELL;
      request.price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   } else {
      Print("OPEN failed: unknown mode ", mode);
      return false;
   }

   if(sl > 0) request.sl = sl;
   if(tp > 0) request.tp = tp;

   ResetLastError();

   if(!OrderSend(request, result)) {
      Print(
         "OPEN failed | Symbol=", _Symbol, " Mode=", mode,
         " Volume=", volume, " | Error=", GetLastError()
      );
      return false;
   }

   Print(
      "OPEN | Symbol=", _Symbol, " Mode=", mode,
      " Volume=", volume, " | Retcode=", result.retcode
   );

   return result.retcode == TRADE_RETCODE_DONE || result.retcode == TRADE_RETCODE_DONE_PARTIAL;
}
//=============================================
bool ExecuteDeletePending()
{
   bool allSuccess = true;

   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      ulong tticket = OrderGetTicket(i);

      if(tticket == 0)
         continue;

      if(!OrderSelect(tticket))
         continue;

      ENUM_ORDER_TYPE type =
         (ENUM_ORDER_TYPE)OrderGetInteger(ORDER_TYPE);

      bool isPending =
         type == ORDER_TYPE_BUY_LIMIT ||
         type == ORDER_TYPE_SELL_LIMIT ||
         type == ORDER_TYPE_BUY_STOP ||
         type == ORDER_TYPE_SELL_STOP ||
         type == ORDER_TYPE_BUY_STOP_LIMIT ||
         type == ORDER_TYPE_SELL_STOP_LIMIT;

      if(!isPending) continue;

      MqlTradeRequest request = {};
      MqlTradeResult result = {};

      request.action = TRADE_ACTION_REMOVE;
      request.order  = tticket;

      ResetLastError();

      if(!OrderSend(request, result))
      {
         allSuccess = false;

         Print(
            "Delete pending failed | Ticket=",
            tticket,
            " | Error=",
            GetLastError()
         );

         continue;
      }

      Print(
         "Delete pending | Ticket=",
         tticket,
         " | Retcode=",
         result.retcode
      );
      if(result.retcode != TRADE_RETCODE_DONE)
         allSuccess = false;
   }
   return allSuccess;
}
//=============================================
bool ExecuteClose(string mode)
{
   bool allSuccess = true;
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong tickett = PositionGetTicket(i);
      if(tickett == 0) continue;
      if(!PositionSelectByTicket(tickett)) continue;

      ENUM_POSITION_TYPE positionType =
         (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      if(mode == "BUY" && positionType != POSITION_TYPE_BUY) continue;
      if(mode == "SELL" && positionType != POSITION_TYPE_SELL) continue;
      string symbol = PositionGetString(POSITION_SYMBOL);
      double volume = PositionGetDouble(POSITION_VOLUME);

      MqlTradeRequest request = {};
      MqlTradeResult result = {};

      request.action   = TRADE_ACTION_DEAL;
      request.position = tickett;
      request.symbol   = symbol;
      request.volume   = volume;
      request.magic    = MagicNumber;
      request.deviation = 20;

      if(positionType == POSITION_TYPE_BUY) {
         request.type  = ORDER_TYPE_SELL;
         request.price = SymbolInfoDouble(symbol, SYMBOL_BID);
      } else {
         request.type  = ORDER_TYPE_BUY;
         request.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
      }
      ResetLastError();

      if(!OrderSend(request, result)) {
         allSuccess = false;
         Print("Close failed | Ticket=", tickett, " | Error=", GetLastError());
         continue;
      }
      Print("Close | Ticket=", tickett, " | Retcode=", result.retcode);
      if(result.retcode != TRADE_RETCODE_DONE &&
         result.retcode != TRADE_RETCODE_DONE_PARTIAL)
      {
         allSuccess = false;
      }
   }

   return allSuccess;
}
//=============================================
// Closes every open position whose net floating P/L (profit + swap)
// is on the requested side. wantProfit=true closes profitable positions,
// wantProfit=false closes losing ones. Breakeven (net == 0) positions
// are left untouched either way.
bool ExecuteCloseByPnl(bool wantProfit)
{
   bool allSuccess = true;
   int matched = 0;

   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      ulong tickett = PositionGetTicket(i);
      if(tickett == 0) continue;
      if(!PositionSelectByTicket(tickett)) continue;

      double net = PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);

      if(wantProfit && net <= 0) continue;
      if(!wantProfit && net >= 0) continue;

      matched++;

      string symbol = PositionGetString(POSITION_SYMBOL);
      double volume = PositionGetDouble(POSITION_VOLUME);
      ENUM_POSITION_TYPE positionType =
         (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);

      MqlTradeRequest request = {};
      MqlTradeResult result = {};

      request.action    = TRADE_ACTION_DEAL;
      request.position   = tickett;
      request.symbol      = symbol;
      request.volume      = volume;
      request.magic        = MagicNumber;
      request.deviation  = 20;

      if(positionType == POSITION_TYPE_BUY) {
         request.type  = ORDER_TYPE_SELL;
         request.price = SymbolInfoDouble(symbol, SYMBOL_BID);
      } else {
         request.type  = ORDER_TYPE_BUY;
         request.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
      }

      ResetLastError();

      if(!OrderSend(request, result)) {
         allSuccess = false;
         Print("Close by PnL failed | Ticket=", tickett, " | Error=", GetLastError());
         continue;
      }

      Print("Close by PnL | Ticket=", tickett, " | Net=", net, " | Retcode=", result.retcode);
      if(result.retcode != TRADE_RETCODE_DONE &&
         result.retcode != TRADE_RETCODE_DONE_PARTIAL)
      {
         allSuccess = false;
      }
   }

   // No matching positions is not a failure - there was simply nothing to do.
   if(matched == 0) return true;
   return allSuccess;
}
//===========================
void SendCommandAck(long commandId, bool success, string message)
{
   string json = StringFormat(
      "{\"account_number\":\"%s\","
      "\"account_token\":\"%s\","
      "\"command_id\":%I64d,"
      "\"success\":%s,"
      "\"message\":\"%s\"}",
      AccountNumber,
      AccountToken,
      commandId,
      success ? "true" : "false",
      message
   );
   string response;
   if(!HttpPost("/api/ea/command/ack", json, response)) {
      Print("Command ACK failed.");
      return;
   }
   Print("Command ACK: ", response);
}
//======================================================
void ShowSignal(
   string signalTime,
   string type,
   double priceFrom,
   double priceTo,
   double sl,
   double tp)
{
   if(Status.status != "FOLLOWER") {
      HideSignalNotification();
      return;
   }
   string priceText;

   if(type == "POSITION") {
      if(priceTo > 0 && MathAbs(priceTo - priceFrom) > 0.0000001) {
         priceText = StringFormat("%.2f -> %.2f", priceFrom, priceTo);
      } else {
         priceText = StringFormat("%.2f", priceFrom);
      }
   } else if(type == "MODIFY") {
      priceText = StringFormat("%.2f", priceFrom );
   } else if(type == "CLOSE") {
      priceText = StringFormat("%.2f -> %.2f", priceFrom, priceTo);
   } else {
      priceText = StringFormat("%.2f", priceFrom);
   }

   string text =
      "ForexHub Signal\n"
      "New Signal: " + signalTime + "\n"
      "Type: " + type + "\n"
      "Price: " + priceText + "\n"
      "SL: " + DoubleToString(sl, 2) + "\n"
      "TP: " + DoubleToString(tp, 2);
      
   ShowSignalNotification(text, true);
}
//=====================================================
void NotifyPositionResult(string result)
{
   if(Status.status != "FOLLOWER") return;

   string text;
   if(result == "TP") {
      text =
         "ForexHub\n"
         "Congratulations!\n"
         "Position closed by Take Profit.";
   } else if(result == "SL") {
      text =
         "ForexHub\n"
         "Position closed by Stop Loss.";
   } else {
      text =
         "ForexHub\n"
         "Position closed.";
   }
   ShowSignalNotification(text, false);
   if(result == "TP")
      PlaySound("ForexHubTP.wav");
   else
   if(result == "SL")
      PlaySound("ForexHubSL.wav");
}
//=====================================================
void ShowSignalNotification(string text, bool playSound)
{
   //if(Status.status != "FOLLOWER") return;

   // Background
   if(ObjectFind(0, FH_SIGNAL_BG) < 0) {
      ObjectCreate(0, FH_SIGNAL_BG, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   }
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_XDISTANCE, 10);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_YDISTANCE, 20);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_XSIZE, 360);
   ObjectSetInteger(0,  FH_SIGNAL_BG, OBJPROP_YSIZE, 150);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_BGCOLOR, clrWhite);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_COLOR, clrSilver);
   ObjectSetInteger(0, FH_SIGNAL_BG, OBJPROP_BACK, true);
   // Text
   if(ObjectFind(0, FH_SIGNAL_TEXT) < 0)
   {
      ObjectCreate(0, FH_SIGNAL_TEXT, OBJ_LABEL, 0, 0, 0);
   }
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_CORNER, CORNER_LEFT_UPPER);
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_XDISTANCE, 22);
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_YDISTANCE, 30);
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_COLOR, clrBlack);
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_FONTSIZE, 10);
   ObjectSetString(0, FH_SIGNAL_TEXT, OBJPROP_FONT, "Arial");
   ObjectSetString(0, FH_SIGNAL_TEXT, OBJPROP_TEXT, text);
   ObjectSetInteger(0, FH_SIGNAL_TEXT, OBJPROP_BACK, false);

   if(playSound)
      PlaySound("alert.wav");

   ChartRedraw();
}
//=====================================================
void HideSignalNotification()
{
   ObjectDelete(0, FH_SIGNAL_BG);
   ObjectDelete(0, FH_SIGNAL_TEXT);

   ChartRedraw();
}
//=====================================================
void ShowSignalWaiting()
{
   if(Status.status != "FOLLOWER") {
      HideSignalNotification();
      return;
   }
   string text =
      "ForexHub EA\n"
      "FOLLOWER\n"
      "\n"
      "Waiting for signal...";
   ShowSignalNotification(text, false);
}
//======================================================
void CheckMasterRapidOpen()
{
   if(Status.status != "MASTER") return;
   if(Status.followerCount <= 0) return;
   datetime now = TimeCurrent();

   if(LastMasterOpenTime > 0) {
      long diff = (long)(now - LastMasterOpenTime);
      if(diff < 15 * 60) {
         int minutes = (int)(diff / 60);

         ShowMasterRapidWarning(minutes);
         PlaySound("alert.wav");
      }
   }
   LastMasterOpenTime = now;
}
//=================================================
void ShowMasterRapidWarning(int minutes)
{
   //CreateWarningBackground();
   CreateWarningText(FH_WARN_TITLE,"ForexHub - WARNING",25, 30);
   CreateWarningText(FH_WARN_LINE1, "Rapid trading detected", 25,55);
   string line2 = StringFormat("Previous OPEN: %d minutes ago", minutes);
   CreateWarningText(FH_WARN_LINE2,line2,25,80);
   CreateWarningText(FH_WARN_LINE3,"Signal may NOT be sent to followers.",25,105);
}
//===================================================
void CreateWarningText(string name, string text, int x, int y)
{
   if(ObjectFind(0, name) < 0) {
      ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
   }
   ObjectSetInteger(0,name, OBJPROP_CORNER,CORNER_LEFT_UPPER);
   ObjectSetInteger(0,name,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,name,OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0,name,OBJPROP_COLOR,clrBlack);
   ObjectSetInteger(0,name,OBJPROP_FONTSIZE,10);
   ObjectSetString(0,name,OBJPROP_FONT,"Arial");
   ObjectSetString(0,name,OBJPROP_TEXT,text);
}
//============================
void HideMasterRapidWarning()
{
   ObjectDelete(0, FH_WARN_BG);
   ObjectDelete(0, FH_WARN_TITLE);
   ObjectDelete(0, FH_WARN_LINE1);
   ObjectDelete(0, FH_WARN_LINE2);
   ObjectDelete(0, FH_WARN_LINE3);

   ChartRedraw();
}
//=================================================================================================
void UpdateChartDashboard()
{
   // 1. Definisikan array teks untuk dashboard
   string lines[];
   ArrayResize(lines, 9);
   
   lines[0] = nameEA;
   lines[1] = "----------------------";
   lines[2] = "Account:  " + IntegerToString(AccountNumber);
   lines[3] = "Connected:     " + (Status.connected ? "ON" : "OFF");
   lines[4] = "Activated:     " + (Status.activated ? "ON" : "OFF");
   lines[5] = "Heartbeat:  " + IntegerToString(Status.heartbeat) + " sec";
   lines[6] = "Status: " + Status.status; 
   lines[7] = "  Message:    ";
   lines[8] = "'" + Status.message + "'";

   // 2. Pengaturan posisi dan visual grafik
   int x_offset = 20;       // Jarak dari batas kanan chart (pixel)
   int y_start  = 20;       // Jarak awal dari batas atas chart (pixel)
   int y_spacing = 18;      // Jarak antar baris teks (pixel)
   string font_name = "Courier New"; // Font monospace agar teks rapi sejajar
   int font_size = 12;
   color text_color = clrWhite;

   // 3. Loop untuk membuat atau memperbarui setiap baris teks
   for(int i = 0; i < ArraySize(lines); i++)
   {
      string obj_name = "FH_Dash_Line_" + IntegerToString(i);
      
      // Buat objek jika belum ada
      if(ObjectFind(0, obj_name) < 0)
      {
         ObjectCreate(0, obj_name, OBJ_LABEL, 0, 0, 0);
      }
      
      // Atur properti objek agar berada di kanan atas
      ObjectSetInteger(0, obj_name, OBJPROP_CORNER, CORNER_RIGHT_UPPER);
      ObjectSetInteger(0, obj_name, OBJPROP_ANCHOR, ANCHOR_RIGHT_UPPER);
      ObjectSetInteger(0, obj_name, OBJPROP_XDISTANCE, x_offset);
      ObjectSetInteger(0, obj_name, OBJPROP_YDISTANCE, y_start + (i * y_spacing));
      ObjectSetString(0, obj_name, OBJPROP_TEXT, lines[i]);
      ObjectSetString(0, obj_name, OBJPROP_FONT, font_name);
      ObjectSetInteger(0, obj_name, OBJPROP_FONTSIZE, font_size);
      ObjectSetInteger(0, obj_name, OBJPROP_COLOR, text_color);
      ObjectSetInteger(0, obj_name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, obj_name, OBJPROP_HIDDEN, true);
   }
   
   // Refresh chart untuk langsung menampilkan perubahan
   ChartRedraw(0);
}
//===========================================================================================================
void Disconnect()
{
Print("Activated = ", Status.activated);
   if(!Status.connected)
      return;

   string json = StringFormat(
      "{\"account_number\":\"%s\",\"account_token\":\"%s\"}",
      AccountNumber,
      AccountToken
   );

   string response;
   HttpPost("/api/ea/disconnect", json, response);
   Status.connected = false;
   Status.activated = false;
   Status.message = "Disconnected";
   UpdateChartDashboard();
}
