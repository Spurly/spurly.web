---
updatedAt: 2026-03-16T09:04:48.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Retrieving users

*Feature available for :**Linkedin, WhatsApp, Instagram, Telegram***

# Get an Attendee

Once you have chat and messages, you might want to match them with Users. Use the [GET /chat\_attendees/\{id}](https://developer.unipile.com/reference/chatattendeescontroller_getattendeebyid) or [GET /chat\_attendees](https://developer.unipile.com/reference/chatattendeescontroller_listallattendees) API Methods or the appropriate SDK Methods.

# Get a User with a public identifier

You can retrieve a user profile, including its **Provider Internal ID** providing the **Provider Public ID** by using the [GET /users/\{provider\_public\_id}](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) API Method or the appropriate SDK Method.

This can be useful to start new chats with unknown users.

If the user is [unknown](https://developer.unipile.com/docs/users-overview), this method does not sync the user into Unipile. It's a just a proxy to the provider. This means he will not appear in attendees lists unless you start a new chat with him.

# Get a public identifier from an Attendee

For now, public identifiers are not present in Attendees, so you can use the [GET /users/\{provider\_id}](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier) Method or the appropriate SDK Method to find it by passing the **Provider Internal ID** found in Attendees and Messages

Be careful how you implement  action GET /users/\{provider\_id/provider\_public\_id}, please have a look on [Provider limits and restrictions](https://developer.unipile.com/docs/provider-limits-and-restrictions)

# Example of retrieving a full LinkedIn profile

## Using route [Retrieve a profile](https://developer.unipile.com/reference/userscontroller_getprofilebyidentifier)

You need to have already connected your LinkedIn account to proceed with this request. Make sure to use the account\_id in each request.\
If you want to retrieve this profile: <https://www.linkedin.com/in/satyanadella/> , you should use only the last part of the URL "satyanadella" as identifier. You can use provider\_id as identifier too, example ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ.\
We use the parameter "linkedin\_sections"="\*" to retrieve all data of the profiles like experience, skills, about...

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/users/satyanadella?linkedin_sections=%2A&account_id=3H-KVe-mQ2GT9M0hKSkgHgs \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
```
```typescript Node SDK
await client.users.getProfile({
  account_id: '3H-KVe-mQ2GT9M0hKSkgHgs',
  identifier: 'julien-crepieux',
});
```

## Result

```json
{
	"object": "UserProfile",
	"provider": "LINKEDIN",
	"provider_id": "ACoAAAEkwwAB9KEc2TrQgOLEQ-vzRyZeCDyc6DQ",
	"public_identifier": "satyanadella",
	"member_urn": "19186432",
	"first_name": "Satya",
	"last_name": "Nadella",
	"headline": "Chairman and CEO at Microsoft",
	"primary_locale": {
		"country": "US",
		"language": "en"
	},
	"is_open_profile": true,
	"is_premium": true,
	"is_influencer": true,
	"is_creator": true,
	"is_relationship": false,
	"network_distance": "THIRD_DEGREE",
	"is_self": false,
	"websites": [
		"https://snscratchpad.com/"
	],
	"follower_count": 11888916,
	"connections_count": 831,
	"location": "Redmond, Washington, United States",
	"profile_picture_url": "https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1579726625423?e=1775088000&v=beta&t=Ke9Wy1fa4eAgmuIdSmUPQg85GN-VoyFApO_SsW5cE5I",
	"profile_picture_url_large": "https://media.licdn.com/dms/image/v2/C5603AQHHUuOSlRVA1w/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1579726625483?e=1775088000&v=beta&t=H-7LfJ2hU-6Dg0eu-bVNKYcrKkcE_n4Wua1h7cb9mzc",
	"background_picture_url": "https://media.licdn.com/dms/image/v2/D5616AQFuhBYf-ocZug/profile-displaybackgroundimage-shrink_200_800/B56ZeD5uqRGQAY-/0/1750264638752?e=1775088000&v=beta&t=bcEcaplw3US6QTZgh-QUcEadmklqCGP55bAqrZ1uG-o",
	"education_total_count": 3,
	"education": [
		{
			"school_id": "8398",
			"school": "The University of Chicago Booth School of Business",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/D560BAQFZO05jhYKSkw/company-logo_200_200/company-logo_200_200/0/1692627816910/universityofchicagoboothschoolofbusiness_logo?e=1775088000&v=beta&t=fhSQymVMLTTrUVveNXRwmHsRe3xkU2-rZEVQRSsSNSE",
			"start": "1/1/1994",
			"end": "1/1/1996"
		},
		{
			"degree": "Bachelor’s Degree, Electrical Engineering",
			"school_id": "577550",
			"school": "Manipal Institute of Technology",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/C510BAQH66KkTTZFJ2A/company-logo_200_200/company-logo_200_200/0/1630615963889/manipal_institute_of_technology_logo?e=1775088000&v=beta&t=sY6G7ams2UJUCnx7Kd18rZPeTbcLCcbKs5EdbMsbXm4",
			"start": null,
			"end": null
		},
		{
			"degree": "Master’s Degree, Computer Science",
			"school_id": "166690",
			"school": "University of Wisconsin-Milwaukee",
			"school_picture_url": "https://media.licdn.com/dms/image/v2/D4D0BAQE47QlO_LG8SQ/company-logo_200_200/company-logo_200_200/0/1729615751602/uwmilwaukee_logo?e=1775088000&v=beta&t=zHNvcNj0G6oeXcIp3SEc5cvjzOuEpF3GlsLX2qvf2TE",
			"start": null,
			"end": null
		}
	],
	"work_experience_total_count": 5,
	"work_experience": [
		{
			"company_id": "1035",
			"company": "Microsoft",
			"position": "Chairman and CEO",
			"location": "Greater Seattle Area",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/D560BAQH32RJQCl3dDQ/company-logo_200_200/B56ZYQ0mrGGoAM-/0/1744038948046/microsoft_logo?e=1775088000&v=beta&t=IU8z-ovPIfLA6desCvsvN81PkiQ9dC8YJehCWbSpeaE",
			"skills": [],
			"start": "2/1/2014",
			"end": null
		},
		{
			"company_id": "3881",
			"company": "University of Chicago",
			"position": "Member Board Of Trustees",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQHbp_dv8CAlpQ/company-logo_200_200/company-logo_200_200/0/1630577480920/uchicago_logo?e=1775088000&v=beta&t=gZcfr87KIOB5Q1O96545PeXLBBdJwqkCts9zJ5ZM5kU",
			"skills": [],
			"start": "1/1/2018",
			"end": null
		},
		{
			"company_id": "2271",
			"company": "Starbucks",
			"position": "Board Member",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQEQxk9y2rk7Hw/company-logo_200_200/company-logo_200_200/0/1631316692275?e=1775088000&v=beta&t=gPReGwzVY-7kTU7YmIb3bf1ChroCSzQYgIuTlbB9Sxg",
			"skills": [],
			"start": "1/1/2017",
			"end": "1/1/2024"
		},
		{
			"company_id": "5301945",
			"company": "The Business Council U.S.",
			"position": "Chairman",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/C4D0BAQGcnaZNpjMvrw/company-logo_200_200/company-logo_200_200/0/1630557702704/the_business_council_us_logo?e=1775088000&v=beta&t=gdGrYqTpAGt4z25joyshjNr6JsC5hPNpqtm3Xx3q7B4",
			"skills": [],
			"start": "1/1/2021",
			"end": "1/1/2023"
		},
		{
			"company_id": "7158",
			"company": "Fred Hutch",
			"position": "Board Member",
			"company_picture_url": "https://media.licdn.com/dms/image/v2/D4D0BAQGF4eOou62nvQ/company-logo_200_200/company-logo_200_200/0/1664795263764/fredhutch_logo?e=1775088000&v=beta&t=96Fe9OEO_KUOqLHRZEdGOLH4c_q2QnrVwGtC-eapSSo",
			"skills": [],
			"start": "1/1/2016",
			"end": "1/1/2022"
		}
	],
	"skills_total_count": 0,
	"skills": [],
	"languages_total_count": 0,
	"languages": [],
	"certifications_total_count": 0,
	"certifications": [],
	"summary": "As chairman and CEO of Microsoft, I define my mission and that of my company as empowering every person and every organization on the planet to achieve more.",
	"volunteering_experience_total_count": 0,
	"volunteering_experience": [],
	"projects_total_count": 0,
	"projects": [],
	"recommendations": {
		"given_total_count": 1,
		"given": [
			{
				"caption": "May 3, 2010, Satya managed Ken directly",
				"text": "Ken is one of the solid engineering managers I have worked with.  Ken has the rare combination of skills/talent that one looks for in engineering leadership – attention to detail and also drive for innovation.  Ken also has a solid track record of recruiting and retaining good talent.  Overall it was a pleasure working with Ken and would love to have the opportunity to work together again.",
				"actor": {
					"first_name": "Ken",
					"last_name": "Moss",
					"provider_id": "ACoAAACv_-sB5Ql4SvCZjwLgDeGUZjlW_V0nnKU",
					"public_identifier": "iamkenmoss",
					"headline": "Bringing the magic of software and AI to help as many people around the world as possible",
					"public_profile_url": "https://www.linkedin.com/in/iamkenmoss",
					"profile_picture_url": "https://media.licdn.com/dms/image/v2/C5603AQFr7695HjAeXw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1633122939776?e=1775088000&v=beta&t=3zM7QQ6VBwQTRpajvyT5_a4i0L5yaP_eKvs5zc2EWes"
				}
			}
		],
		"received_total_count": 0,
		"received": []
	},
	"hashtags": []
}
```