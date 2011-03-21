/*!
 * jQuery AjaxQ - AJAX request queueing for jQuery
 * http://plugins.jquery.com/project/ajaxq
 *
 * Copyright 2008, Oleg Podolsky
 * Licensed under the MIT (MIT-LICENSE.txt) license.
 *
 * AUTHORS
 * Oleg Podolsky (oleg.podolsky@gmail.com)
 * Marcel Jackwerth (marcel.jackwerth@gmail.com) 
 */
(function($) {
  $.configureAjaxq = function (queue, options) {
    // Initialize storage for request queues if it's not initialized yet
    if (typeof document.ajaxq == "undefined") {
      document.ajaxq = {
        q: {},
        r: null
      };
    }

    var fullOptions = {
      complete: function() {},
      start: function() {},
      mostRecentOnly: false
    };

    $.extend(fullOptions, options);

    // Initialize current queue if it's not initialized yet
    if (typeof document.ajaxq.q[queue] === "undefined") {
      document.ajaxq.q[queue] = {
        requests: [],
        complete: fullOptions.complete,
        start: fullOptions.start,
        mostRecentOnly: fullOptions.mostRecentOnly
      };
    }
  };

  $.ajaxq = function (queue, options)
  {
    $.configureAjaxq(queue, {});

    if (typeof options !== "undefined") // Request settings are given, enqueue the new request
    {
      // Copy the original options, because options.complete is going to be overridden
      var optionsCopy = {};
      for (var o in options) {
        if(options.hasOwnProperty(o)) {
          optionsCopy[o] = options[o];
        }
      }
      
      options = optionsCopy;

      if(document.ajaxq.q[queue].mostRecentOnly === true && document.ajaxq.r !== null) {
        var currentRequest = document.ajaxq.q[queue].requests.shift();
        document.ajaxq.q[queue].requests = [ currentRequest ];
      }

      // Override the original callback

      var originalCompleteCallback = options.complete;

      options.complete = function (request, status)
      {
        // Dequeue the current request
        document.ajaxq.q[queue].requests.shift();
        document.ajaxq.r = null;

        // Run the original callback
        if (originalCompleteCallback) {
          originalCompleteCallback (request, status);
        }

        // Run the next request from the queue
        if (document.ajaxq.q[queue].requests.length > 0) {
          document.ajaxq.r = $.ajax(document.ajaxq.q[queue].requests[0]);
        } else {
          document.ajaxq.q[queue].complete();
        }
      };

      // Enqueue the request
      document.ajaxq.q[queue].requests.push(options);

      // Also, if no request is currently running, start it
      if (document.ajaxq.q[queue].requests.length === 1) {
        document.ajaxq.q[queue].start();
        document.ajaxq.r = $.ajax(options);
      }
    }
    else // No request settings are given, stop current request and clear the queue
    {
      var complete = document.ajaxq.q[queue].complete;
      var start = document.ajaxq.q[queue].start;

      if (document.ajaxq.r)
      {
        document.ajaxq.r.abort ();
        document.ajaxq.r = null;
      }

      document.ajaxq.q[queue] = undefined;

      $.configureAjaxq(queue, {
        start: start,
        complete: complete
      });
    }
  };
})(jQuery);