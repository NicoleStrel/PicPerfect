const Apify = require('apify');
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

function clean_locations(locations){
    cleaned=[];
    for (i = 0; i < locations.length; i++) { 
        new_loc=locations[i]
    
        //remove space/new lines beggining:
        if (new_loc.charAt(0) == " "){
            new_loc=new_loc.substring(1);
        }
        if (new_loc.charAt(0) == "\n"){
            new_loc=new_loc.substring(2);
        }
        //remove the weird thing
        new_loc=new_loc.replace('\"','');
        new_loc=new_loc.replace('\"','');
        
        //remove brackets
        new_loc=new_loc.replace("(", '');
        new_loc=new_loc.replace(")", '');

        //remove emoji
        new_loc=new_loc.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        //remove unessasary things after these characters:
        idx=new_loc.indexOf("@");
        if (idx !=-1 && idx !=0){
            new_loc=new_loc.substring(0,idx);
        }
        idx2=new_loc.indexOf("|");
        if (idx2 !=0 && idx2 !=-1){
            new_loc=new_loc.substring(0,idx2);
        }
        idx3=new_loc.indexOf("©");
        if (idx3 !=-1 && idx3!=0){
            new_loc=new_loc.substring(0,idx3);
        }
        idx4=new_loc.indexOf("\n");
        if (idx4 !=-1 && idx4 !=0){
            new_loc=new_loc.substring(0,idx4);
        }
        idx5=new_loc.indexOf("❄️");
        if (idx5 !=-1 && idx5 !=0){
            new_loc=new_loc.substring(0,idx5);
        }
        idx6=new_loc.indexOf("by");
        if (idx6 !=-1 && idx6 !=0){
            new_loc=new_loc.substring(0,idx6);
        }
        idx7 = new_loc.toLowerCase().indexOf("photo")
        if (idx7 !=-1 && idx7 !=0){
            new_loc=new_loc.substring(0,idx7);
        }
        idx8=new_loc.indexOf("#");
        if (idx8 !=-1 && idx8 !=0){
            new_loc=new_loc.substring(0,idx8);
        }
        
        //remove ending space
        if (new_loc.charAt(new_loc.length-1) == " "){
            new_loc=new_loc.substring(0,new_loc.length-1);
        }
        
        cleaned.push(new_loc)
    }
    return cleaned
}

Apify.main(async () => {
    const input = await Apify.getValue('INPUT')
    const dataset = await Apify.openDataset('tumblr-dataset');

    // Object from `./apify_storage/key_value_stores/default/INPUT.json`
    if (!input || !input.keyword) throw new Error('INPUT must contain a keyword!')

    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: `https://www.tumblr.com/search/travel+${input.keyword}` });
    
    const handlePageFunction = async ({ request, $ }) => {
        //get first occuring image of tumblr post
        const imglinks = $('.GzjsW').find('.CQmeg:first-child').find('.seYEy:first-child').find('.xhGbM[srcset^="https://64.media.tumblr.com"]')
            .map((i, el) => $(el).attr('srcset').split(" ").slice(-2)[0]) //get highest definition image from sourceset (at the end)
            .get()
        
        //remove image div so we can look at the first text element
        $('.CQmeg').remove()

        //find first text element of post
        const locations = $('.GzjsW').find('.k31gt:first-child')
            .map((i, el) => $(el).text())
            .get()

        dataset.pushData({locations: clean_locations(locations), imglinks: imglinks});

    };

    // Set up the crawler, passing a single options object as an argument.
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        handlePageFunction,
    });

    await crawler.run();
});