import { uniqueNamesGenerator, adjectives, starWars } from 'unique-names-generator';

export function generateUniqueRoomId(roomToUsersMap){
    let roomId = "";

    while(roomId.length==0 || roomToUsersMap.has(roomId)){
        roomId = uniqueNamesGenerator({
            dictionaries: [adjectives, starWars],
            separator:"-"
        })  
        roomId = roomId.toLowerCase().replace(" ","-"); 
    }

    return roomId;
}
