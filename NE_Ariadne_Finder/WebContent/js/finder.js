/*
 * Copyright ARIADNE Foundation
 * 
 * The Finder can be customised by providing a javascript function 'customizeFinder()'
 * that returns an object with parameters. See example below.
 * The parameters that can be specifies are:
 * 
 * externalSources: an Array. Default is ["eur","wp","scr","ss","gb"]
 * 		eur: Europeana
 * 		wp: Wikipedia
 * 		scr: Scribd
 * 		ss: Slideshare
 * 		gb: Google Books
 * 		They are rendered in the order given
 * facets: an Array. Default is ["provider","language","format","context","lrt"]
 * 		'lrt' means Learning resource type
 * 		They are rendered in the order given
 * facetIncludes: an Object with facets as possible members.
 * 		For example {"language":["en","fr","nl","de"],"provider":["ARIADNE","OERcommons"]}
 * limitFacetDisplay:an Object with facets as possible members.
 * 		For example {"language":["en","fr","nl","de"]},
 * maxLengthDescription:  Default is 650
 * pageContainers: an Array. Default is ["bottom"]. Available options are ["bottom","top"]
 * pageSize: Default is 10
 * repositoryName: Default is "ARIADNE"
 * serviceUrl: the URL of the repository services. Default is "http://ariadne.cs.kuleuven.be/GlobeFinderF1/servlet/search"
 * 
 * function customizeFinder() {
	return {
		"repositoryName": "AgLR",
		"pageContainers":["top","bottom"],
		"facets":["provider","lrt","language","context"]
	}}
 * All global variables are now capitalised. 
 * All local variables should be declared with a 'var' in the respective function, and should not be capitalised.
 */

/* In order to target your repository you need to change values REPOSITORY_NAME and SERVICE_URL
 * and also the same values inside the index.jsp at customizeFinder() function !
 */

//ex. var SERVICE_URL = 'http://localhost:8080/repository/api/ariadne/restp';
//var SERVICE_URL = 'http://ariadne.cs.kuleuven.be/GlobeFinderF1/servlet/search';
var EXT_SOURCE_URL = 'http://ariadne.cs.kuleuven.be/GlobeFinderF1/servlet/search';
var SERVICE_URL = 'http://localhost:8080/NE_Repository/api/ariadne/restp';
var ROOT_URL = 'http://ariadne.cs.kuleuven.be/finder/';
var START_DESCRIPTION = 0;
var END_DESCRIPTION = 650;
var REPOSITORY_NAME = "NE_Repo"; // you will find yours inside
									// ariadne.properties file ex. var
									// REPOSITORY_NAME = "AriadneNext
									// Repository";
var THOUSAND_SEP = ',';
var FACET_TOKENS = [ 'provider', 'licenseUri','classification','commonName','date', 'type', 'format', 'language', 'rights','spatial','temporal','metadataLanguage' ];
var FACET_INCLUDES = [];
var FACET_LABELS = {};

FACET_LABELS['provider'] = 'Provider';
FACET_LABELS['licenseUri'] = 'License URI';
FACET_LABELS['classification'] = 'Classification';
FACET_LABELS['commonName'] = 'Common Name';
FACET_LABELS['date'] = 'Date';
FACET_LABELS['type'] = 'Type';
FACET_LABELS['format'] = 'Format';
FACET_LABELS['language'] = 'Language';
FACET_LABELS['rights'] = 'Rights';
FACET_LABELS['spatial'] = 'Spatial';
FACET_LABELS['temporal'] = 'Temporal';
FACET_LABELS['metadataLanguage'] = 'Metadata Language';

// FACET_LABELS['contribute'] = 'Contributor'; // added in order to check the
// field

var LIMIT_FACET_DISPLAY = {};
var PAGE_CONTAINERS = [];
var EXT_SOURCES = [ 'eur', 'wp', 'scr', 'ss', 'gb' ];
var AVAILABLE_ES = {};
AVAILABLE_ES['eur'] = {
	"engine" : "Europeana",
	"name" : "Europeana"
};
AVAILABLE_ES['wp'] = {
	"engine" : "Wikipedia",
	"name" : "Wikipedia"
};
AVAILABLE_ES['scr'] = {
	"engine" : "Scribd",
	"name" : "Scribd"
};
AVAILABLE_ES['ss'] = {
	"engine" : "SlideShare",
	"name" : "Slide Share"
};
AVAILABLE_ES['gb'] = {
	"engine" : "GoogleBooks",
	"name" : "Google Books"
};
var PAGE;
var PAGE_SIZE = 10;
var NR_RESULTS = 0;
var FINDER_INITIALIZED = false;

var CHECK = 0;
var langName = {};
var iter = 0;

langName['en'] = 'English';
langName['eng;'] = 'English';
langName['eng'] = 'English';
langName['eng; eng'] = 'English';

langName['fr'] = 'French';
langName['el'] = 'Greek';
langName['hu'] = 'Hungarian';
langName['et'] = 'Estonian';
langName['nl'] = 'Dutch';
langName['ro'] = 'Romanian';
langName['de'] = 'German';
langName['tr'] = 'Turkish';

google.load("language", "1");

Event.observe(window, 'load', function() {
	initialSearch();
});

function initialSearch() {
	initializeFinder();
	var qs = location.search.substring(1);
	var parms = qs.toQueryParams();
	if (parms.query != undefined && parms.query != '') {
		$('query').value = parms.query;
	}
	if ($F('query').blank()) {
		resetFacets();
		findMaterials(0, PAGE_SIZE, true, true);
	} else {
		doSearch();
	}
}

function initializeFinder() {
	if (!FINDER_INITIALIZED) {
		if (typeof customizeFinder == 'function') {
			var customParams = customizeFinder();
			if (customParams) {
				if (customParams.serviceUrl)
					SERVICE_URL = customParams.serviceUrl;
				if (customParams.repositoryName)
					REPOSITORY_NAME = customParams.repositoryName;
				if (customParams.facets)
					FACET_TOKENS = customParams.facets;
				if (customParams.facetIncludes) {
					var ff = [];
					for (key in customParams.facetIncludes) {
						ff.push(key + ":" + customParams.facetIncludes[key]);
					}
					;
					FACET_INCLUDES = ff;
				}
				if (customParams.limitFacetDisplay)
					LIMIT_FACET_DISPLAY = customParams.limitFacetDisplay;
				if (customParams.maxLengthDescription)
					END_DESCRIPTION = customParams.maxLengthDescription;
				if (customParams.pageSize)
					PAGE_SIZE = customParams.pageSize;
				if (customParams.pageContainers) {
					PAGE_CONTAINERS = [];
					for ( var i = 0; i < customParams.pageContainers.length; i++) {
						PAGE_CONTAINERS.push('pagination_'
								+ customParams.pageContainers[i]);
					}
				}
				if (customParams.externalSources)
					EXT_SOURCES = customParams.externalSources;
			}
		}
		if (PAGE_CONTAINERS.indexOf('pagination_top') >= 0) {
			if (!$('insert_pagination_top')) {
				$('body')
						.insert(
								'<div id="insert_pagination_top" style="display:none"></div>');

			}
			$('insert_pagination_top')
					.update('<DIV id="pagination_top"></DIV>');
		}
		if (PAGE_CONTAINERS.indexOf('pagination_bottom') >= 0) {
			if (!$('insert_pagination_bottom')) {
				$('body')
						.insert(
								'<div id="insert_pagination_bottom" style="display:none"></div>');
			}
			$('insert_pagination_bottom').update(
					'<DIV id="pagination_bottom"></DIV>');
		}
		if (!$('insert_summary')) {
			$('body').insert(
					'<div id="insert_summary" style="display:none"></div>');
		}
		$('insert_summary')
				.update(
						'<div id="summary" class="separator_top" ><div id="search_title"><H1><span id="search_terms"></span><B class="barfont" style="font-weight:bold"><span id="search_results_index"></span></B></H1></div><div id="search_status"></div></div>');
		if (!$('insert_facets')) {
			$('body').insert(
					'<div id="insert_facets" style="display:none"></div>');
		}
		var div = [];
		div.push('<DIV id="facets">');
		for ( var i = 0; i < FACET_TOKENS.length; i++) {
			var fn = FACET_TOKENS[i];

			div.push('<DIV id="rb_' + fn + '" class="rbSection">');
			div.push('<DIV class="rbHeader"><SPAN id="' + fn
					+ '" class="ws_label" onclick="toggleFacet(\'rb_' + fn
					+ '\'); return false;"><SPAN class="ico"></SPAN>'
					+ FACET_LABELS[fn] + '</SPAN></DIV>');
			div.push('<DIV class="rbsrbo"><ul id="' + fn
					+ '_rbo" class="rbList"></ul>');
			div.push('</DIV></DIV>');
		}
		div
				.push('<DIV id="rb_Clear" class="rbClear"><input type="submit" name="id" value="Unselect all" onclick="initialSearch();pagination_hide();">');
		div.push('</DIV>');

		div.push('</DIV>');

		$('insert_facets').update(div.join(''));
		if (!$('insert_results')) {
			$('body').insert(
					'<div id="insert_results" style="display:none"></div>');
		}
		var div = [];
		var msg = 'Search the #{repName} Repository'.interpolate({
			repName : REPOSITORY_NAME
		});
		div.push('<DIV id="results">');
		div.push('<div id="searchMessage"><h3 align="center">' + msg
				+ '</h3></div>');
		div
				.push('<div id="noResults" style="display:none"><h3 align="center">No Results Found</h3></div>');
		div.push('<div id="search_results"></div>');
		div.push('</div>');
		$('insert_results').update(div.join(''));
		if (!$('insert_moreResults')) {
			$('body').insert(
					'<div id="insert_moreResults" style="display:none"></div>');
		}
		var div = [];
		div.push('<div id="moreResults"><h3>More Results</h3>');
		for ( var i = 0; i < EXT_SOURCES.length; i++) {
			var es = EXT_SOURCES[i];
			var esn = AVAILABLE_ES[es]['name'];
			div.push('<div id="' + es + '_search" class="ext-res-div">');
			div.push('<a class="ext-res" onclick="getExternalSourceResult(\''
					+ es + '\');" href="javascript:void(0)" title="' + esn
					+ '">' + esn + '</a>');
			div.push('<span id="' + es
					+ '_indicator" style="display:none"><img src="' + ROOT_URL
					+ 'common/images/indicator.gif"></span>');
			div.push('<span id="' + es + '_results"></span>');
			div.push('</DIV>');
		}
		div.push('</DIV>');
		$('insert_moreResults').update(div.join(''));
		initializeJamlTemplates();
		PAGE = new YAHOO.widget.Paginator({
			rowsPerPage : PAGE_SIZE,
			totalRecords : NR_RESULTS,
			containers : PAGE_CONTAINERS,
			template : "{PreviousPageLink} {PageLinks} {NextPageLink}"
		});
		PAGE.render();
		PAGE.subscribe('changeRequest', handlePagination);
		pagination_hide();

		FINDER_INITIALIZED = true;
	}
}

function toggleFacet(el) {
	$(el).toggleClassName('rbOpen');
}

function pagination_hide() {
	if ($('pagination_top'))
		$('pagination_top').hide();
	if ($('pagination_bottom'))
		$('pagination_bottom').hide();
}

function pagination_show() {
	if ($('pagination_top'))
		$('pagination_top').show();
	if ($('pagination_bottom'))
		$('pagination_bottom').show();
}

function resetFacets() {
	if ($('facets')) {
		var facets = $('facets').select('ul.rbList');
		$$('.ws_label').each(function(el) {
			el.removeClassName('parent-selected');
		});
		facets.each(function(item, index) {
			$(item.id).update('');
		});
	}
}

function getExternalSourceResult(prefix, engine) {
	if ($(prefix + '_results').empty()) {
		if ($F('query').blank()) {
			alert('Please enter a search string');
		} else {
			searchExternalSource(prefix, engine);
		}
	} else {
		$(prefix + '_results').update();
	}
}

function searchExternalSource(prefix) {
	var es_query = prepareQueryString();
	var res = $(prefix + '_results');
	$(prefix + '_indicator').show();
	res.update('');
	var clauses = [ {
		language : 'VSQL',
		expression : es_query
	} ];
	var request = {
		clause : clauses,
		resultFormat : 'json'
	};

	new Ajax.JSONRequest(EXT_SOURCE_URL, {
		callbackParamName : "callback",
		method : 'get',
		parameters : {
			json : Object.toJSON(request),
			engine : AVAILABLE_ES[prefix]['engine']
		},
		onSuccess : function(transport) {
			var result = transport.responseText.evalJSON(true).result;

			result['title'] = 'Search ' + AVAILABLE_ES[prefix]['name'];
			res.insert(Jaml.render(prefix + '_field', result));
		},
		onComplete : function(transport) {
			$(prefix + '_indicator').hide();
		}
	});
}

function doSearch() {
	if ($F('query').blank()) {
		alert('Please enter a search string');
		return;
	}
	$('searchMessage').hide();

	// showFacets();
	resetFacets();
	findMaterials(0, PAGE_SIZE, true, false);
	searchExternalSources();
}

function externalSourceSelected(prefix) {
	return !$(prefix + '_results').empty();
}

function searchExternalSources() {
	for ( var i = 0; i < EXT_SOURCES.length; i++) {
		if (externalSourceSelected(EXT_SOURCES[i]))
			searchExternalSource(EXT_SOURCES[i]);
	}
}

function prepareQueryString() {
	var spq = $F('query').split('keyword:');
	var text = spq[0];
	if (text.blank()) {
		if (spq.length > 1) {
			text = spq[1];
		}
	}
	text = text.strip();
	return text;
}

function searchByKeyword(key) {
	$('query').value = "keyword:" + key;
	doSearch();
}

function parseQueryString(initUpdate) {
	var spq = $F('query').split('keyword:');
	var plainText = spq[0];
	var clauses = [];
	if (!plainText.blank()) {
		clauses.push({
			language : 'VSQL',
			expression : plainText
		});
	}
	if (spq.length > 1) {
		var keyword = spq[1];
		clauses.push({
			language : 'anyOf',
			expression : 'keyword:' + keyword
		});
	}
	if (plainText.blank()) {
		clauses.push({
			language : 'anyOf',
			expression : 'collection:*'
		});
	}
	return clauses;
}

// Example use formatInteger(12345678,',')
function formatInteger(number, com) {
	var num = number.toString();
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(num)) {
		num = num.replace(rgx, '$1' + com + '$2');
	}
	return num;
}

function findMaterials(start, numberResults, needsUpdate, initUpdate) {
	var selectedFacets = $('facets').select('li.facet-selected');

	// document.getElementById("searchQuery").innerHTML=
	// "start: <br/><h3>"+start+"</h3>"
	// +"numberResults: <br/><h3>"+numberResults+"</h3>"
	// +"needsUpdate: <br/><h3>"+needsUpdate+"</h3>"
	// +"initUpdate: <br/><h3>"+initUpdate+"</h3>";

	var facetExpressions = $H();
	selectedFacets.each(function(item, index) {
		var pos = item.id.indexOf(':');
		var facet = item.id.substring(0, pos);
		var facetValue = item.id.substring(pos + 1);
		facetValue = facetValue.replace(/\"/g, "'");
		facetExpressions.set(facet,
				(facetExpressions.get(facet) == undefined) ? facetValue
						: facetExpressions.get(facet) + "," + facetValue);
	});

	var clauses = parseQueryString(initUpdate);

	facetExpressions.each(function(pair) {
		clauses.push({
			language : 'anyOfFacet',
			expression : pair.key + ":" + pair.value
		});

	});
	FACET_INCLUDES.each(function(exp) {
		clauses.push({
			language : 'anyOfFacet',
			expression : exp
		});

	});

	// alert(JSON.stringify(clauses));

	var request = {
		clause : clauses,
		resultInfo : 'display',
		resultListOffset : start,
		resultListSize : numberResults,
		idListOffset : start,
		uiLanguage : 'en',
		facets : FACET_TOKENS,
		idListSize : numberResults,
		resultFormat : 'json',
		resultSortkey : ''
	};

	// document.getElementById("jsonRequest").innerHTML="Request:
	// <br/><h3>"+JSON.stringify(request)+"</h3>";

	// alert(JSON.stringify(request));

	if (!$F('query').blank())
		$('search_terms').update($F('query'));

	$('search_status').update('Searching...');
	$('noResults').hide();

	new Ajax.JSONRequest(
			SERVICE_URL,
			{
				callbackParamName : "callback",
				method : 'get',
				parameters : {
					json : Object.toJSON(request),
					engine : 'InMemory'
				},
				onSuccess : function(transport) {
					var result = transport.responseText.evalJSON(true).result;

					// alert(JSON.stringify(result));
					// document.getElementById("jsonResponse").innerHTML="Response:
					// <br/><h3>"+JSON.stringify(result)+"</h3>";

					$('search_results').update('');
					$('noResults').hide();

					$('search_status').update(
							'Processing time: '
									+ (result.processingTime / 1000).toFixed(3)
									+ ' seconds');

					if (initUpdate) {
						$('searchMessage')
								.insert(
										'<h3 align="center">Available: '
												+ formatInteger(
														result.nrOfResults, ',')
												+ ' learning resources</h3>');
					} else {
						$('search_terms').update('Results: ');
						$('searchMessage').update('');
						if (result.metadata.size() == 0) {
							$('noResults').show();
						}

						result.metadata
								.each(function(item, index) {
									if (item.keywords == undefined
											|| item.keywords == '')
										$('search_results')
												.insert(
														Jaml
																.render(
																		'resultwithoutkeywords',
																		item));
									else {

										try {
											item.keywords = item.keywords
													.split("&#044; ");
										} catch (e) {
										}

										var spt = item.title.split(",", 1);
										item.title = spt[0];
										var length = spt[0].length;

										if (item.title[0] == '[')
											item.title = item.title.substring(
													1, length);
										else
											item.title = item.title.substring(
													0, length);

										// spt = item.description.split(",",1);
										// item.description=spt[0];
										// length = spt[0].length;
										length = END_DESCRIPTION;

										if (item.description[0] == '[')
											item.description = item.description
													.substring(1, length);
										else
											item.description = item.description
													.substring(0, length);

										if (item.description.indexOf(']') != -1) {
											spt = item.description.split("]");
											item.description = spt[0];
										}

										// spt = item.description.split(",",1);
										// item.description=spt[0];

										spt = item.metaMetadataId.split(",");
										item.metaMetadataId = spt[1];
										spt = item.metaMetadataId.split(" ");
										item.metaMetadataId = spt[1];
										spt = item.metaMetadataId.split("]");
										item.metaMetadataId = spt[0];
										// length = spt[1].length;
										// item.metaMetadataId =
										// item.metaMetadataId.substring(1,length);*/
										// alert(item.metaMetadataId);

										if (item.format.indexOf('pdf') != -1)
											item.format = './icons/pdf.png';
										else if (item.format
												.indexOf('powerpoint') != -1)
											item.format = './icons/ppt.png';
										else if (item.format.indexOf('video') != -1)
											item.format = './icons/video.png';
										else if (item.format.indexOf('zip') != -1)
											item.format = './icons/zip.png';
										else if (item.format.indexOf('audio') != -1)
											item.format = './icons/audio.png';
										else if ((item.format.indexOf('text') != -1)
												|| (item.format
														.indexOf('multipart') != -1))
											item.format = 'http://open.thumbshots.org/image.aspx?url='
													+ 'item.location';
										else if ((item.format.indexOf('xml') != -1))
											item.format = './icons/xml.png';
										else if (item.format.indexOf('image') != -1)
											item.format = './icons/image.png';
										else if ((item.format.indexOf('word') != -1)
												|| (item.format
														.indexOf('wordprocessingml') != -1))
											item.format = './icons/word.png';
										else if ((item.format
												.indexOf('application') != -1))
											item.format = './icons/application.png';
										else if ((item.format == ''))
											item.format = './icons/application.png';

										$('search_results').insert(
												Jaml.render('result', item));

										expand();

										// alert(item.metaMetadataId);
										iter++;
									}
								});

						$('search_results_index').show();

						var finalNumberResults = ((start + numberResults) < result.nrOfResults) ? (start + numberResults)
								: result.nrOfResults;
						if (result.nrOfResults > 0) {
							$('search_results_index')
									.update(
											' (#{start} - #{end} of #{total})'
													.interpolate({
														start : formatInteger(
																start + 1,
																THOUSAND_SEP),
														end : formatInteger(
																finalNumberResults,
																THOUSAND_SEP),
														total : formatInteger(
																result.nrOfResults,
																THOUSAND_SEP)
													}));
							pagination_show();
						} else {
							$('search_results_index').update(
									'(No Results Found)');
							pagination_hide();
						}

						/*
						 * for facet presentation
						 * result.facets.each(function(item,index){
						 *  // item.title = item.title.substring(0,length);
						 * 
						 * $('search_results').insert(Jaml.render('result2',item));
						 * 
						 * });
						 */

					}

					/*
					 * if(!keyword.blank()){ $('keywords_filter').show();
					 * $('kwv').update(keyword); } else{
					 * $('keywords_filter').hide(); }
					 */

					if (needsUpdate) {
						updatePaginator(result.nrOfResults);
						result.facets
								.each(function(item, index) {
									var fld = item.field;
									// rbkey = facetKeys[fld];
									var facetHasNoLimit = true;
									var limitValues = [];
									if (LIMIT_FACET_DISPLAY[fld]) {
										limitValues = LIMIT_FACET_DISPLAY[fld];
										facetHasNoLimit = false;
									}
									var rbkey = fld;
									var element = $(rbkey + '_rbo');
									if (element
											&& facetExpressions.get(fld) == undefined) {
										element.update('');
										if (item.numbers != undefined) {
											item.numbers
													.each(function(it2, idx2) {
														if (facetHasNoLimit
																|| limitValues
																		.indexOf(it2.val) >= 0) {

															it2.field = fld;

															it2.val = it2.val
																	.replace(
																			/\'/g,
																			"&#34;");
															it2.count = formatInteger(
																	it2.count,
																	THOUSAND_SEP);
															// element.insert(Jaml.render('rbcriteria',it2));
															if (fld != "language")
																element
																		.insert(Jaml
																				.render(
																						'rbcriteria',
																						it2));

															else
															// check first if
															// langName[it2.val]
															// exists already in
															// rbList
															{
																checkLang(
																		it2.val,
																		it2.count);

																if (CHECK == 0)
																	element
																			.insert(Jaml
																					.render(
																							'rbcriteria2',
																							it2));

															}
														}
													});
										}
									}
								});

						selectedFacets.each(function(item, index) {
							$(item.id).addClassName('facet-selected');

						});
					}
					// webSnapr.init();
					$('header').scrollTo();
					loadTranslator();
				},
				onComplete : function(transport) {
					// $('search_status').update('');
				},
				onLoading : function() {
					$('search_results').update('');
					$('search_terms').update('');
					$('search_results_index').update('');
				}
			});
}

function checkLang(name, counter) {

	CHECK = 0;
	$$('#language_rbo li').each(
			function(item) {

				// alert(item.innerHTML);

				var pos = item.id.indexOf(':');

				var langValue = item.id.substring(pos + 1);

				if (langName[langValue] == langName[name]) {
					// pos = item.name.indexOf('/a');
					var count = item.innerHTML;
					pos = count.indexOf('/a');
					var length = count.length;
					count = item.innerHTML.substring(pos + 5, length - 1);

					count = count.replace(",", "");
					var num = count * 1;

					num = Number(num) + Number(counter);
					num = formatInteger(num, THOUSAND_SEP);

					item.update(item.innerHTML.substring(0, pos + 4)
							+ '(#{count})'.interpolate({
								count : num
							}));
					CHECK = 1;

					return;
				}

			});

	/*
	 * var names = $('language_rbo').select('ul.rbList');
	 * 
	 * names.each(function(item){
	 * 
	 * //var pos = item.id.indexOf(':'); var facet = item.id;
	 * //.substring(0,pos); //var langValue = item.id.substring(pos+1);
	 * alert(facet); if (langName[langValue]== langName[name]) alert("EVRHKA");
	 * 
	 * });
	 */

}

function loadTranslator() {

	var script = new Element(
			'script',
			{
				'type' : 'text/javascript',
				'src' : 'http://translate.google.com/translate_a/element.js?cb=googleSectionalElementInit&ug=section&hl=auto'
			});

	$('script-translator').childElements().each(function(el) {
		el.remove();
	});
	$('script-translator').appendChild(script);

	if (google.translate) {
		new google.translate.SectionalElement({
			sectionalNodeClassName : 'lodescription',
			controlNodeClassName : 'control',
			background : '#ffffcc'
		}, 'google_sectional_element');
	}

	$$('.lodescription').each(
			function(data) {
				var toTranslate = data.innerHTML.stripScripts().unescapeHTML()
						.replace(/[\n\r\s]+/g, ' ').replace('Translate', '');
				google.language.detect(toTranslate, function(result) {
					if (!result.error) {
						if (result.language == 'en') {
							data.descendants()[0].hide();
						}

					}
				});
			});

}

function addEndingDescription(data) {
	if (data.length == 0)
		return "";
	return (data.length < END_DESCRIPTION) ? data : (data.substr(
			START_DESCRIPTION, END_DESCRIPTION)).concat("",
			" <span class='suspension-points'>...</span>");
}

function removeHtmlTags(data) {
	var strInputCode = data.replace(/&(lt|gt);/g, function(strMatch, p1) {
		return (p1 == "lt") ? "<" : ">";
	});
	var strTagStrippedText = strInputCode.replace(/<\/?[^>]+(>|$)/g, " ");
	return strTagStrippedText;
}

function stripUrl(data) {

	var strTagStrippedText = data.replace(/<\/?[^>]:+(>|$)/g, "_");
	return strTagStrippedText;

}

function initializeJamlTemplates() {

	Jaml.register('thumb_pres', function(data) {
		// img({src:'./icons/'+ data.format +'.png'})
		// img({src:'http://SnapCasa.com/Get.aspx?url='+data.identifier})
		// img({src:data.format});
		a({
			href : data.location,
			title : data.title,
			target : '_blank'
		}, img({
			src : data.format,
			height : "48",
			width : "48"
		}))
		// img({src:'http://open.thumbshots.org/image.aspx?url='+'http://edis.ifas.ufl.edu/topic_ag_peanuts'})
	});

	Jaml.register('keyword', function(data) {
		a({
			href : 'javascript:void(0);',
			onclick : "searchByKeyword('#{key}')".interpolate({
				key : data
			})
		}, data);
	});

	/*
	 * Jaml.render('first_title',function(data){ a({href:data.location,title:
	 * data.title, target: '_blank'},data.title) });
	 */

	Jaml
			.register(
					'result',
					function(data) {
						div(
								{
									cls : 'row'
								},

								div({
									cls : 'lotitle'
								}, a({
									href : data.location,
									title : data.title,
									target : '_blank'
								}, data.title)
								// Jaml.render('first_title',data.title)
								),

								div(
										{
											cls : 'thumb'
										},
										// img({src:'./images/pdf.jpg'}),
										Jaml.render('thumb_pres', data),
										div(
												{
													cls : 'lodescription'
												},
												div({
													cls : 'control'
												}),
												removeHtmlTags(addEndingDescription(data.description)))

								),

								div(
										{
											cls : 'moremeta'
										},
										p(),
										span({
											cls : 'heading'
										}, 'more info'),
										div(
												{
													cls : 'metacontent'
												},
												'Identifier: ',
												a({
													href : data.identifier,
													title : data.identifier,
													target : '_blank'
												}, data.identifier),
												br(),
												'Context: ',
												data.context,
												br(),
												span({
													cls : 'keywords'
												}, span({
													cls : 'bold'
												}, 'Keywords: '), Jaml.render(
														'keyword',
														data.keywords)),
												br(),
												a(
														{
															href : "http://83.212.96.169:8080/repository2/services/oai?verb=GetRecord&metadataPrefix=oai_lom&identifier="
																	+ data.metaMetadataId,
															title : "View all meta",
															target : '_blank'
														}, "View all meta"),
												br()

										)));
					});

	Jaml.register('resultwithoutkeywords', function(data) {
		div({
			cls : 'row'
		}, div({
			cls : 'lotitle'
		}, a({
			href : data.location,
			title : data.title,
			target : '_blank'
		}, data.title)), div({
			cls : 'snip'
		}, div({
			cls : 'lodescription'
		}, div({
			cls : 'control'
		}), removeHtmlTags(addEndingDescription(data.description)))));
	});

	Jaml.register('rbcriteria', function(data) {

		li({
			id : data.field + ':' + data.val
		}, a({
			href : 'javascript:void(0);',
			title : data.val,
			onclick : "toggleFacetValue('#{id}','#{parent}')".interpolate({
				id : data.field + ':' + data.val,
				parent : data.field
			})
		}, data.val), '(#{count})'.interpolate({
			count : data.count
		}));
	});

	Jaml.register('rbcriteria2', function(data) {
		li({
			id : data.field + ':' + data.val
		}, a({
			href : 'javascript:void(0);',
			title : data.val,
			onclick : "toggleFacetValue('#{id}','#{parent}')".interpolate({
				id : data.field + ':' + data.val,
				parent : data.field
			})
		}, langName[data.val]), '(#{count})'.interpolate({
			count : data.count
		}));
	});

	for ( var i = 0; i < EXT_SOURCES.length; i++) {

		Jaml.register(EXT_SOURCES[i] + '_field', function(data) {
			a({
				href : data.apiurl,
				title : data.title,
				target : '_blank'
			}, "<br>(" + formatInteger(data.nrOfResults, THOUSAND_SEP)
					+ " results)");
		});
	}
}

function expand() {

	jQuery(document).ready(function() {

		jQuery('.metacontent').hide();
		jQuery('.heading').click(function()
		// jQuery('#'+id).click(function()
		{
			jQuery(this).next('.metacontent').slideToggle(500);
			// jQuery(this).next("#"+id).slideToggle(500);
			exit();
		});

	});

}

function updatePaginator(NR_RESULTS) {
	PAGE.set('totalRecords', NR_RESULTS);
	PAGE.set('recordOffset', 0);
}

function handlePagination(newState) {
	// Collect page data using the requested page number
	// newState.
	findMaterials(newState.recordOffset, newState.rowsPerPage, false, false);
	// Update the Paginator's state
	PAGE.setState(newState);

}

function selectParent(parent) {
	var childSelected = false;

	$(parent + '_rbo').childElements().each(function(el) {
		if (el.hasClassName('facet-selected')) {
			$(parent).addClassName('parent-selected');
			childSelected = true;
		}
	});

	if (!childSelected)
		$(parent).removeClassName('parent-selected');
}

function toggleFacetValue(elem, parent) {
	$(elem).toggleClassName('facet-selected');
	selectParent(parent);
	findMaterials(0, PAGE_SIZE, true, false);
}

function html_entity_decode(str) {
	var ta = document.createElement("textarea");
	ta.innerHTML = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	var val = ta.value;
	ta.parentNode.removeChild(ta);
	return val;
}

function fullLangName(iso) {

	var fullName = "";

	if (iso == "en")
		fullName = langName["en"];
	else if (iso == "fr")
		fullName = langName["fr"];

	return fullName;
}
