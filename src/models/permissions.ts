/* 
    PERMISSIONS
    /ticket-info    
    /sell           
    /check-in       
    /kitchen        
    /cashier    /checkpoint
    /dashboard
    /tickets    /blocks
    /users      /earnings
    /generate
    /csv-orders
*/

export enum UserPermissions {
    INFO_BIGLIETTO  = 1 << 0, // 1
    VENDITA         = 1 << 1, // 2
    CHECK_IN        = 1 << 2, // 4
    CUCINA          = 1 << 3, // 8
    CASSA           = 1 << 4, // 16
    DASHBOARD       = 1 << 5, // 32
    LISTA_BIGLIETTI = 1 << 6, // 64
    UTENTI          = 1 << 7, // 128
    GENERAZIONE     = 1 << 8, // 256
    ORDINI          = 1 << 9, // 512
}
