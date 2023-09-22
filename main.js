/*assumptions:
-bootstrap
-jquery
-font-awesome

-could potentially add these in via libraries.yml?
*/

/*concerns/room for improvement:
-probably not most elegant solution. also may not scale well
-have worked a lot with consuming APIs but never worked with nested/chained AJAX calls
-couldn't really test deploying on actual drupal environment
-couldn't really confirm if infinite scrolling is functioning
-took me longer than it probably should have
-formatting/layout isn't very aesthetically pleasing
-school name or sport name could be link for filtering purposes?
-in the extra credit, to enable sport-specific videos, have to put it in the CMS UI, then add parameter to initial AJAX call
*/

$(document).ready(function() {
    //defaults
    let pager = 0;
    loadPage(pager, false);

    //for infinite scroll
    $(window).scroll(function(){ 
        if ( $(window).scrollTop() + $(window).height() > $(document).height - 100 ) {
            pager++;
            loadPage(pager, false)
        }
    })
})

//function to make api call
function loadPage(pager, loading) {
    let str = "";
    if( loading == false ) {
        loading = true;
        $.ajax({
            //pageSize query parameter could be used here so that it can be altered/editable?
            url: "",//"https://testurl.com/v3/vod?page=" + pager,
            type: "get",
            data: {
                pager: pager
            },
            //UI to show data is being fetched
            beforeSend: function(){
                $(".ajax-load").show();
                return;
            },
            //when data fetch is finally completed
            success: function(data) {
                //hide loading UI
                $(".ajax-load").hide();
                loading = false;
                //parse through fetched data for each video
                for ( let i = 0; i < data['programs'].length; i++ ) {
                    let schoolsArr = [];
                    //get school id(s) associated with each video and store in array
                    //there may be multiple schools 
                    //also error handling in case it's empty
                    if ( data['programs'][i]['schools'] != null ) {
                        for ( let j = 0; j < data['programs'][i]['schools'].length; j++ ) {
                            schoolsArr.push(data['programs'][i]['schools'][j]['id']);
                        }
                    }
                    else {
                        schoolsArr.push("null");
                    }
                    //store sport id
                    //didn't seem to be empty so no error handling
                    //could be added
                    let sport = data['programs'][i]['sports'][0]['id'];
                    //build string that contains info
                    str += '<div class="row"><div class="col">'+
                        '<img src="' + data['programs'][i]['images']['small'] +'" alt="' + data['programs'][i]['title'] + '" data-number="'+ i +'"/>'+
                        '<h4>'+ data['programs'][i]['title'] +'</h4>'+
                        //convert duration from API to more legible time
                        '<p>'+ millisToMinutesAndSeconds(data['programs'][i]['duration']) +'</p>';
                    //chain next ajax call
                    //pass in relevant data
                    loadSports(str,sport, schoolsArr);
                    //reset variablees
                    str = "";
                    sport = 0;
                    schoolsArr = [];
                }
            }
        }).fail(function(jqXHR, ajaxOptions, thrownError){
            //if an error occurs, display that to user
            $(".error-message").show();
            //console error to help debug problem
            console.log("Error fetching VOD API");
        });
    }
}

function loadSports(str, sports, schools) {
    //declare variable to build string for sports data
    let sportsStr = "";
    $.ajax({
        url: "", //"https://testurl.com/v3/sports/" + sports,
        type: "get",
        success: function(data) {
            //build string for sports
            sportsStr += str + "<p>" + data['name'] + "</p>";
            //chain next ajax call and pass data
            loadSchools( sportsStr, schools, "" );
        }
    }).fail(function(jqXHR, ajaxOptions, thrownError){
        $(".error-message").show();
        //console error to help debug problem
        console.log("Error fetching Sports API");
    });
}

function loadSchools(str, schools, schoolsStr) {
    $.ajax({
        url: "",//"https://testurl.com/v3/schools/" + schools[0],
        type: "get",
        success: function(data) { 
            //error handling if schools is not null
            //still output majority of info even if null
            //just don't show "null" school name
            if (schools[0] != "null") {   
                schoolsStr += "<p>" + data['name'] + "</p>";
            }
            //test if schools passed in is greater than 1 or an array
            //if so, reduce the size of array and recursively call function
            if ( schools.length > 1 ) {
                schools.shift();
                loadSchools(str,schools, schoolsStr);
            }
            //if not greater than 1
            //append full string to html markup
            else {
                str += schoolsStr + "</div></div>";
                $("#post-data").append(str);
            }
        }
    }).fail(function(jqXHR, ajaxOptions, thrownError){
        $(".error-message").show();
        //console error to help debug problem
        console.log("Error fetching Schools API");
    });
}

//function to transforrm millisecond duration to
//something more human readable
function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
