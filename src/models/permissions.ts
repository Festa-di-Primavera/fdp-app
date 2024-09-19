/* 
    PERMISSIONS
    / (home)        
    /ticket-info    
    /check-out      
    /sell           
    /check-in       
    /kitchen        
    /cashier        
    /dashboard      
    /tickets        
    /users          
    /generate       
*/

export enum UserPermissions {
    TICKET_INFO=1 << 0,     // 1
    CHECK_OUT=1 << 1,       // 2
    SELL=1 << 2,            // 4
    CHECK_IN=1 << 3,        // 8
    KITCHEN=1 << 4,         // 16
    CASHIER=1 << 5,         // 32
    DASHBOARD=1 << 6,       // 64
    TICKETS=1 << 7,         // 128
    USERS=1 << 8,           // 256
    GENERATE=1 << 9,        // 512
}