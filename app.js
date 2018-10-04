const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')
const app = express()

app.use(cors())

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/email_debug.log', {flags : 'a'});
var log_stdout = process.stdout;

// var corsOptions = {
//   origin: 'http://localhost:3000',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }


var helper = require('sendgrid').mail;
const async = require('async');

const urlencodedParser = bodyParser.urlencoded({ extended: false })
var datetime = new Date();

NODE_NO_WARNINGS=1

function sendEmail(
    parentCallback,
    fromEmail,
    toEmails,
    subject,
    textContent,
    htmlContent
  ) {
    const errorEmails = ["Something went wrong!"];
    const successfulEmails = ["Thanks for your feedback!"];
  const sg = require('sendgrid')('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');
  async.parallel([
      function(callback) {
        // Add to emails
        for (let i = 0; i < toEmails.length; i += 1) {
          // Add from emails
          const senderEmail = new helper.Email(fromEmail);
          // Add to email
          const toEmail = new helper.Email(toEmails[i]);
          // HTML Content
          const content = new helper.Content('text/html', htmlContent);
          const mail = new helper.Mail(senderEmail, subject, toEmail, content);
          var request = sg.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: mail.toJSON()
          });
          sg.API(request, function (error, response) {
            log_file.write(datetime+ ' SendGrid API Call');
            if (error) {
              log_file.write(datetime+' ==== Error response received')
            }
            // console.log(response.statusCode);
            // console.log(response.body);
            // console.log(response.headers);
          });
        }
        // return
        callback(null, true);
      }
    ], function(err, results) {
      log_file.write(util.format(datetime +'====== Done') + '\n');
    });
    parentCallback(null,
      {
        successfulEmails: successfulEmails,
        errorEmails: errorEmails,
      }
    );
}
app.post('/vachanfeedback', function (req, res, next) {
	var userName = req.body.name || "Unknown User Feedback",
  		fromEmail = req.body.email || "thevachanonline@gmail.com",
  		userMessage = req.body.message;

	toEmails = ["udayonrails@gmail.com"];

	async.parallel([
	  function (callback) {
	    sendEmail(
	      callback,
	      fromEmail,
	      toEmails,
	      'VachanOnline End User Mail from - '+userName+'!',
	      'Thanks for your feedback!',
	      '<p style="font-size: 12px;">Name: '+userName+'<br><hr>'+userMessage+'</p><br><br><a href="https://vachanonline.com">VachanOnline Page!</a>'
	    );
	  }
	], function(err, results) {
	  res.send({
	    success: true,
	    message: userMessage,
	    successfulEmails: results[0].successfulEmails,
	    errorEmails: results[0].errorEmails,
	  });
	});
});

app.listen(3000, function () {
  log_file.write(util.format(datetime + ' ===== Example app listening on port 3000!') + '\n');
})

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};