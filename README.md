# Documentation for sso.isan.to

### The SSO service provides a simple to use API for getting the Ident scope from the discord OAuth2 system

To start a request first redirect the user to `https://sso.isan.to/login?service=[redirURL]`
 - `redirURL` should be the URL you want the user to be sent too after they finish the OAuth2 process

After the user finishes the OAuth2 request they will be sent to `[redirURL]?code=[uuid]`
 - `redirURL` is the URL you spceified in the first redirect
 - `uuid` is a unique user lookup code that can be used to get the information

To get the user info, simply make a request using the `uuid` you got from the redirect. Make a GET request to `https://sso.isan.to/getuser/[uuid]`. The resonce will be JSON in the following format
```json
{
	"id":"272143648114606083",
	"username":"Strikeeaglechase",
	"avatar":"ff8a39ffe74bc8efbcf60815071aada6",
	"discriminator":"0001",
	"public_flags":0,
	"flags":0,
	"locale":"en-US",
	"mfa_enabled":true,
	"premium_type":2,
	"orgSite": "my.cool.service/login"
}
```
Make sure to check the orgSite to ensure the user is logging in from your login site, and not faking a request from another one