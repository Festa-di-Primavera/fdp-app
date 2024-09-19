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
    INFO_BIGLIETTO=1 << 0,     // 1
    CHECK_OUT=1 << 1,       // 2
    VENDITA=1 << 2,            // 4
    CHECK_IN=1 << 3,        // 8
    CUCINA=1 << 4,         // 16
    CASSA=1 << 5,         // 32
    DASHBOARD=1 << 6,       // 64
    LISTA_BIGLIETTI=1 << 7,         // 128
    UTENTI=1 << 8,           // 256
    GENERAZIONE=1 << 9,        // 512
}