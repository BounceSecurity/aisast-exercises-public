function trackSearch() {
        
    var query = (new URLSearchParams(window.location.search)).get('search');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}


function getSearch()
{
    var query = (new URLSearchParams(window.location.search)).get('search');
    trackSearch1(query);
    trackSearch2(query);
    trackSearch3(query);
}

function sanitize(x) { if (x.isUnsafe()) throw "BAD"}

var query = (new URLSearchParams(window.location.search)).get('search');
 
sanitize(query);
//ok: 04-rca-04-exercise
document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');

function trackSearch1(query) {
        
    var a = "1";
    
    query = new Sanitizer().sanitizeToString(query);
    //ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

function trackSearch2(query) {
        
    var a = "1";
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}


function trackSearch3(query) {     
    
    var a = "1";
    
    query = new Sanitizer().sanitizeToString(query);
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

function trackSearch4(query) {
    
    var a = "1";
    CustomSanitize(query);
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

function trackSearch5(query) {
    
    var a = "1";
    query = CustomSanitize(query)
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}


function getSearch2()
{
    var query = pullInput();
    trackSearch4(query);
    
    trackSearch5(query);
}

function pullInput()
{
    var query = (new URLSearchParams(window.location.href)).get('search');
    return query;
}

function getSearch3(potentiallyDangerous)
{
    var query = potentiallyDangerous.value1;
    
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
    
    potentiallyDangerous.selfClean();

    query = potentiallyDangerous.value1;

    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}


// === Existing test cases above ===

// --- Additional stress tests ---

// Multiple sources chained
function trackSearch6() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    var query2 = (new URLSearchParams(window.location.href)).get('page');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query2+'">');
}

// Sanitize one but not the other
function trackSearch7() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    var query2 = (new URLSearchParams(window.location.search)).get('other');
    query = new Sanitizer().sanitizeToString(query);
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query2+'">');
}

// Sanitize then reassign from source again
function trackSearch8() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    query = new Sanitizer().sanitizeToString(query);
    query = (new URLSearchParams(window.location.search)).get('search');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// Intermediate variable doesn't break taint
function trackSearch9() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    var temp = query;
    var payload = temp;
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+payload+'">');
}

// Safe source - not from window.location
function trackSearch10() {
    var query = (new URLSearchParams("?static=value")).get('search');
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// CustomSanitize by side effect should NOT sanitize (rule uses return value)
function trackSearch11() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    var ignored = CustomSanitize(query);
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// CustomSanitize return value assigned back DOES sanitize
function trackSearch12() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    query = CustomSanitize(query);
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// potentiallyDangerous - selfClean before access is safe
function getSearch4(potentiallyDangerous) {
    potentiallyDangerous.selfClean();
    var query = potentiallyDangerous.value1;
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// potentiallyDangerous - different property still dangerous
function getSearch5(potentiallyDangerous) {
    var query = potentiallyDangerous.value2;
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// sanitize with side effect on the actual variable
function trackSearch13() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    sanitize(query);
    // ok: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// sanitize with side effect but on a different variable
function trackSearch14() {
    var query = (new URLSearchParams(window.location.search)).get('search');
    var other = "safe";
    sanitize(other);
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}

// href source through concatenation
function trackSearch15() {
    var base = window.location.href;
    var query = (new URLSearchParams(base)).get('search');
    // ruleid: 04-rca-04-exercise
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">');
}