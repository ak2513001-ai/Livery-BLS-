// ==UserScript==
// @name         GeoFS Auto Livery
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically applies a livery to a specific aircraft in GeoFS
// @author       YourName
// @match        *://*.geo-fs.com/*
// @match        *://*.geofs.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create floating console
    if(!document.getElementById("autolivery_console")){
        const consoleDiv=document.createElement("div");
        consoleDiv.id="autolivery_console";
        consoleDiv.style.position="fixed";
        consoleDiv.style.bottom="10px";
        consoleDiv.style.right="10px";
        consoleDiv.style.width="250px";
        consoleDiv.style.height="150px";
        consoleDiv.style.overflowY="auto";
        consoleDiv.style.backgroundColor="rgba(0,0,0,0.8)";
        consoleDiv.style.color="#0f0";
        consoleDiv.style.fontFamily="monospace";
        consoleDiv.style.fontSize="12px";
        consoleDiv.style.padding="5px";
        consoleDiv.style.zIndex=9999;
        consoleDiv.innerHTML="<b>Auto-Livery Console</b><br>";
        document.body.appendChild(consoleDiv);
    }

    const log = function(msg){
        const c = document.getElementById("autolivery_console");
        c.innerHTML += msg + "<br>";
        c.scrollTop = c.scrollHeight;
        console.log(msg);
    };

    (async function(){
        try {
            log("Fetching livery data...");
            const resp = await fetch("https://cdn.jsdelivr.net/gh/kolos26/GEOFS-LiverySelector/livery.json");
            const liveryObj = await resp.json();

            const targetAircraftId = "172";   // Cessna 172
            const targetLiveryName = "N73924";

            function getLiveryByName(arr, name){
                return arr.find(l => l.name === name);
            }

            function loadLivery(textures, index, parts, mats){
                try {
                    if(!parts || !textures){
                        log("No parts or textures found.");
                        return;
                    }
                    textures.forEach((t,i)=>{
                        if(parts[i] && t){
                            parts[i].setTexture(t);
                        }
                    });
                    if(mats){
                        Object.keys(mats).forEach(p=>{
                            if(parts[p]){
                                Object.assign(parts[p].material, mats[p]);
                            }
                        });
                    }
                    log("Textures applied successfully.");
                } catch(e){
                    log("❌ Failed applying livery: " + e);
                }
            }

            function applyLivery(ai){
                if(!ai || ai.id !== targetAircraftId) return;
                const acLiveries = liveryObj.aircrafts[targetAircraftId];
                const desired = getLiveryByName(acLiveries, targetLiveryName);
                if(!desired){
                    log("⚠️ Desired livery not found for " + targetAircraftId);
                    return;
                }
                log("✅ Applying livery '"+desired.name+"' to aircraft " + targetAircraftId);
                loadLivery(desired.texture, ai.index, ai.parts, desired.materials || {});
            }

            let lastAcId = null;
            setInterval(()=>{
                if(!window.geofs || !geofs.aircraft || !geofs.aircraft.instance) return;
                const ai = geofs.aircraft.instance;
                if(ai.id !== lastAcId){
                    lastAcId = ai.id;
                    applyLivery(ai);
                }
            }, 1000);

            // Apply immediately if already in aircraft
            if(window.geofs && geofs.aircraft && geofs.aircraft.instance){
                applyLivery(geofs.aircraft.instance);
            }

        } catch(e){
            log("❌ Auto-livery failed: " + e);
        }
    })();
})();
