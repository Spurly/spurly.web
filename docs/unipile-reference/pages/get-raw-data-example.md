---
updatedAt: 2026-09-08T21:16:37.000Z
agentTools:
  projectIndex: https://developer.unipile.com/llms.txt
---

# Get Raw Data Route Example

Learn how to use Magic  Route

The [Get raw data route](https://developer.unipile.com/reference/linkedincontroller_getrawdata) (Magic route) is intended for advanced users who wish to use LinkedIn's features beyond our current capabilities. It enables you to create custom functionalities that are not yet supported by our platform, using connected accounts. To utilize this route, you will need to identify the specific endpoint containing the desired data using web developer tools on LinkedIn, and then copy the URL along with its parameters for implementation.

# Identify Linkedin Enpoint

* Open your browser's Web Developer Tools and go to the 'Network' tab to capture all requests. Perform the action for which you want to collect data. Identify which request corresponds to the action on LinkedIn, then click on it to view the details.
* Copy the relevant value into our interactive documentation. For instance, if you're searching for people using LinkedIn's main Search:

<Image src="https://files.readme.io/b0ef79e-Screenshot_from_2024-01-19_10-36-08.png" align="center" />

* Confirm that you have received the raw data you want by trying it with our interactive documentation.
* Finally, integrate this data into your code, adjusting the variables for keywords or pagination as necessary.

# Inbox Search

This snippet corresponding to first part of relation search:

<Image src="https://files.readme.io/1f517a5-Screenshot_from_2024-06-24_16-12-30.png" align="center" />

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "query_params": {
    "variables": "(keyword:arnaud,types:List(CONNECTIONS))", 
"queryId":"voyagerMessagingDashMessagingTypeahead.47f3aa32ab0b43221f99db7c350a2cc3"
  },
  "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
  "method": "GET",
  "request_url": "https://www.linkedin.com/voyager/api/graphql",
  "encoding": false
}'
```

# Following someone

You have to change the provider private id in the "request\_url" to the id of the person you want to follow

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "body": {"patch":{"$set":{"following":true}}},
  "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
  "method": "POST",
  "request_url": "https://www.linkedin.com/voyager/api/feed/dash/followingStates/urn:li:fsd_followingState:urn:li:fsd_profile:ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E",
  "encoding": false
}'
```

# Get own profile viewers

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(start:0,query:(),analyticsEntityUrn:(activityUrn:urn%3Ali%3Adummy%3A-1),surfaceType:WVMP)&queryId=voyagerPremiumDashAnalyticsObject.c31102e906e7098910f44e0cecaa5b5c",
"encoding": false
}'
```

Profiles are in "data.data.premiumDashAnalyticsObjectByAnalyticsEntity.elements\[]" : navigationUrl, title.text (name), subtitle.text, caption.text, label.text (relation level)...

# Get company page viewers

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "account_id": "OWUJPgyeTKizksxIcOh5pQ",
  "request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(analyticsEntityUrn:(company:urn%3Ali%3Afsd_company%3A106589179),surfaceType:ORGANIZATION_VISITORS,query:(selectedFilters:List((key:timeRange,value:List(1770681600000,1773273599999)),(key:resultType,value:List(PAGE_VIEWS)),(key:pageType,value:List(ALL_PAGES)))))&queryId=voyagerPremiumDashAnalyticsView.d24d2e85d8a23d815c7fd94aa8988261",
  "encoding": false
}
'
```

<br />

# Social Selling Index

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"request_url": "https://www.linkedin.com/sales-api/salesApiSsi",
"force_api": true,
"method": "GET"
}'
```

# Retrieve posts from Feed

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?queryId=voyagerFeedDashMainFeed.7a50ef8ba5a7865c23ad5df46f735709"
}'
```

To manage pagination, you need to retrieve the paginationToken from the result at data.data.feedDashMainFeedByMainFeed.metadata.paginationToken.
Then, perform a new request using the start, count, and the paginationToken obtained from the previous results.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(start:20,count:10,paginationToken:99714011-1754950579467-a40e9db9d667b7ce2ba183fc50169e1b,sortOrder:MEMBER_SETTING)&queryId=voyagerFeedDashMainFeed.7a50ef8ba5a7865c23ad5df46f735709"
}'
```

# Invite to an event

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashInvitations",
"method": "POST",
"body": {
"elements": [{
"inviteeMember": "urn:li:fsd_profile:ACoAACQsq45qSVu3WqOYZw8cueJ0isJ5r9v94",
"genericInvitationType": "EVENT"
}]
},
"query_params": {
"inviter": "(eventUrn:urn%3Ali%3Afsd_professionalEvent%3A7315105458780465155)"
},
"headers": {
"x-restli-method": "batch_create"
},
"encoding": false
}'
```

# Delete relation

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "account_id": "91gPYl0eSeY4IClOgJ5FA",
  "method": "POST",
  "request_url": "https://www.linkedin.com/voyager/api/relationships/dash/memberRelationships",
  "query_params": {
    "action": "removeFromMyConnections",
    "decorationId": "com.linkedin.voyager.dash.deco.relationships.MemberRelationship-34"
  },
  "body": {
    "connectionUrn": "urn:li:fsd_connection:ACoAACQsq45qSVu3WqOYZw8cueJ0isJ5r9v94"
  },
  "encoding": false
}'
```

# Invite people to follow your company page

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/voyagerRelationshipsDashInvitations",
"method": "POST",
"body": {"elements":[{"inviteeMember":"urn:li:fsd_profile:ACoAAAAA4McB8YEREZF3LfNq00l1IgqTzd8crg","genericInvitationType":"ORGANIZATION"},{"inviteeMember":"urn:li:fsd_profile:ACoAAAAA3W4B6ERE8pWg_l5gb6bCaBEa_SEGvGc","genericInvitationType":"ORGANIZATION"}]},
"query_params": {
"inviter": "(organizationUrn:urn%3Ali%3Afsd_company%3A38114588)"
},
"headers": {
"x-restli-method": "batch_create"
},
"encoding": false
}'
```

# Retrieve group participants

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(groupUrn:urn%3Ali%3Afsd_group%3A1781615,filters:List(),typeaheadQuery:%27%27,start:0,count:10,membershipStatuses:List(OWNER,MANAGER,MEMBER))&queryId=voyagerGroupsDashGroupMemberships.ba73dc3bdfac0c95c8488fe4b5715048",
"encoding": false
}'
```

<br />

# School Profile

```curl cURL
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eS0q-VE9HA-VLYA",
"method": "GET",
"request_url": "https://www.linkedin.com/voyager/api/graphql?variables=(organizationalPageUrn:urn%3Ali%3Afsd_organizationalPage%3A1503,context:ORGANIZATIONAL_PAGE_MEMBER_HOME)&queryId=voyagerOrganizationDashViewWrapper.0b8be97f4f1386a8114db0ef77298c51"
}'
```

# Retrieve repost

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/linkedin \
     --header 'X-API-KEY: XXXX' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
"account_id": "91gPYl0eSeY4IClOgJ5FA",
"request_url": "https://www.linkedin.com/voyager/api/graphql",
"method": "GET",
"query_params": {
"queryId": "voyagerFeedDashReshareFeed.dc56f7e6b303133b71fdbb584ec2a2a5",
"variables": "(targetUrn:urn%3Ali%3AugcPost%3A7364593029225123456)"
},
"encoding": false
}'
```

# Send “I’m interested” to a company’s job page

Two-step process

1. Retrieve the form content from the first request response

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "query_params": {
      "variables": "(companyUrn:urn%3Ali%3Afsd_company%3A12345)",
      "queryId": "voyagerTalentbrandDashCandidateInterestMember.d831bf85b9873ef0228a2bab19781290"
    },
    "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
    "method": "GET",
    "request_url": "https://www.linkedin.com/voyager/api/graphql",
    "encoding": false
  }'

```

Replace companyUrn with the target company URN, URL-encoded.

In the response, the field you need is called leadGenForm.

2. Submit the form using the leadGenForm retrieved previously

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "query_params": {
      "action": "submit"
    },
    "body": {
      "form": leadGenForm
    },
    "account_id": "dfR-rG0tQfGhfeP2l5_Bdw",
    "method": "POST",
    "request_url": "https://www.linkedin.com/voyager/api/voyagerFeedDashLeadGenForm",
    "encoding": false
  }'

```

leadGenForm must be the exact object returned by the first request.

This request submits the form to LinkedIn.

<br />

# People you may know

To select which recommendations to retrieve, update the two option-specific values. For pagination, use pageStart as the cursor and pageSize as the limit.

Same School

```
"cohortReasonSource": "PYMK_SCHOOL_COHORT",
"cohortReasonContext": "SCHOOL",
"cohortReasonRelatedSchoolUrns": [
  {    "schoolId": 43416  }
],
```

Recent activity

```

"cohortReasonSource": "IN_SESSION_RELEVANCE",
"cohortReasonContext": "IN_SESSION_RELEVANCE",
```

Same Job

```
"cohortReasonSource": "PYMK_TITLE_COHORT",
"cohortReasonContext": "TITLE",
"cohortReasonRelatedSuperTitleUrns": [
  { "superTitleId": "564" }
],
```

Same industry

```
"cohortReasonSource": "PYMK_INDUSTRY_COHORT",
"cohortReasonContext": "INDUSTRY",
"cohortReasonRelatedIndustryUrns": [
  {  "industryId": 4  }
],
```

<br />

```
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "GMi9RwTXQ1C3-XCoV0rVOg",
  "request_url": "https://www.linkedin.com/flagship-web/rsc-action/actions/pagination",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "pagerId": "com.linkedin.sdui.pagers.mynetwork.addaCohortSeeAll",
    "clientArguments": {
      "$type": "proto.sdui.actions.requests.RequestedArguments",
      "payload": {
        "cohortReasonSource": "PYMK_SCHOOL_COHORT",
        "cohortReasonContext": "SCHOOL",
        "cohortReasonRelatedSchoolUrns": [
          {
            "schoolId": 43416
          }
        ],
        "shouldUseIndexPaging": true,
        "pageStart": 20,
        "pageSize": 10,
        "isFirstPage": false
      },
      "requestMetadata": {
        "$type": "proto.sdui.common.RequestMetadata"
      },
      "states": [],
      "screenId": "com.linkedin.sdui.flagshipnav.mynetwork.CohortSeeAll"
    },
    "paginationRequest": {
      "$type": "proto.sdui.actions.requests.PaginationRequest",
      "pagerId": "com.linkedin.sdui.pagers.mynetwork.addaCohortSeeAll",
      "requestedArguments": {
        "$type": "proto.sdui.actions.requests.RequestedArguments",
        "payload": {
          "cohortReasonSource": "PYMK_SCHOOL_COHORT",
          "cohortReasonContext": "SCHOOL",
          "cohortReasonRelatedSchoolUrns": [
            {
              "schoolId": 43416
            }
          ],
          "shouldUseIndexPaging": true,
          "pageStart": 20,
          "pageSize": 10,
          "isFirstPage": false
        },
        "requestMetadata": {
          "$type": "proto.sdui.common.RequestMetadata"
        }
      }
    }
  }
}'
```

# Create Sales Navigator List

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "account_id": "YOUR ACCOUNT ID",
    "request_url": "https://www.linkedin.com/sales-api/salesApiLists",
    "method": "POST",
    "body": {
      "name": "List Name",
      "listType": "LEAD", // "LEAD" or "ACCOUNT"
      "role": "OWNER",
      "description": "List Description"
  }
}
```

<br />

# Create Recruiter Project

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "account_id": "YOUR ACCOUNT ID",
    "method": "POST",
    "request_url": "https://www.linkedin.com/talent/api/talentHiringProjects",
    "body": {
      "attachDefaultCandidateHiringPipeline": true,
      "hiringProjectMetadata": {
        "name": "Fancy Project Title",
        "archiveOnNotFitRating": false,
        "hiringPipelineEnabled": false,
        "hasSeenArchiveOnNotFitRatingDialog": false,
        "askForFeedbackOnGoodFit": false,
        "state": "ACTIVE",
        "type": "RECRUITER",
        "projectVisibility": "PRIVATE"
      }
    },
    "encoding": false
  }'
```

For public project, set "projectVisibility": "HIRING\_CONTEXT"

# Check current subscription

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "IhkEPOIfQNC4IEUNUBigTg",
  "request_url": "https://www.linkedin.com/mysettings-api/settingsApiManagePremiumAccount",
  "method": "GET"
}'
```

# Unlock Sales navigator profile

```curl
curl --request POST \
  --url https://{YOUR_DSN}/api/v1/linkedin \
  --header 'X-API-KEY: XXXX' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "IhkEPOIfQNC4IEUNUBigTg",
  "request_url": "https://www.linkedin.com/sales-api/salesApiProfiles",
  "method": "POST",
  "query_params": {
    "action": "unlock"
  },
  "body": {
    "profileAuthKey": {
      "profileId": "ACwAEADASDS..."
    }
  },
  "encoding": false
}'
```

# Get post short link

Set `{YOUR_DSN}`, `{YOUR_API_KEY}`, and `{ACCOUNT_ID}` for your connected account, then replace every occurrence of:

* `{POST_URL}`: the full post URL, e.g. `https://www.linkedin.com/posts/member_post-title-share-7419641004556886016-AbCd_/`.
* `{ACTIVITY_ID}`: the post activity ID, e.g. `7419641005567668224`. Keep the prefix before the placeholder; this ID can differ from the share ID in the URL.
* `{CONNECTED_MEMBER_PROFILE_ID}`: the connected member LinkedIn ID, e.g. `ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E`. Use the same ID for `rcm` if present in the URL.

```curl
curl --request POST \
  --url 'https://{YOUR_DSN}/api/v1/linkedin' \
  --header 'X-API-KEY: {YOUR_API_KEY}' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
  "account_id": "{ACCOUNT_ID}",
  "request_url": "https://www.linkedin.com/flagship-web/rsc-action/actions/server-request?sduiid=com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Accept": "*/*",
    "x-li-rsc-stream": "true"
  },
  "body": {
    "requestId": "com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
    "serverRequest": {
      "requestId": "com.linkedin.sdui.requests.feed.createUpdateShareShortlink",
      "requestedArguments": {
        "$type": "proto.sdui.actions.requests.RequestedArguments",
        "requestedStateKeys": [],
        "payload": {
          "longUrl": "{POST_URL}",
          "utmSource": "share",
          "utmMedium": "member_desktop",
          "currentUserNonIterableProfileId": "{CONNECTED_MEMBER_PROFILE_ID}",
          "shareType": "Clipboard",
          "showCopyLinkSuccessToast": true,
          "showCopyLinkSuccessToastAction": true
        },
        "requestMetadata": {
          "$type": "proto.sdui.common.RequestMetadata",
          "currentActor": {
            "$type": "proto.sdui.bindings.core.Bindable",
            "key": {
              "key": {
                "value": {
                  "$case": "id",
                  "id": "identitySwitcherActorContext-urn:li:activity:{ACTIVITY_ID}"
                }
              },
              "namespace": ""
            },
            "content": {
              "$case": "stringBinding",
              "stringBinding": {}
            }
          }
        }
      },
      "isApfcEnabled": false,
      "isStreaming": false,
      "rumPageKey": ""
    },
    "states": [],
    "requestedArguments": {
      "$type": "proto.sdui.actions.requests.RequestedArguments",
      "requestedStateKeys": [],
      "payload": {
        "longUrl": "{POST_URL}",
        "utmSource": "share",
        "utmMedium": "member_desktop",
        "currentUserNonIterableProfileId": "{CONNECTED_MEMBER_PROFILE_ID}",
        "shareType": "Clipboard",
        "showCopyLinkSuccessToast": true,
        "showCopyLinkSuccessToastAction": true
      },
      "requestMetadata": {
        "$type": "proto.sdui.common.RequestMetadata",
        "currentActor": {
          "$type": "proto.sdui.bindings.core.Bindable",
          "key": {
            "key": {
              "value": {
                "$case": "id",
                "id": "identitySwitcherActorContext-urn:li:activity:{ACTIVITY_ID}"
              }
            },
            "namespace": ""
          },
          "content": {
            "$case": "stringBinding",
            "stringBinding": {}
          }
        }
      },
      "states": [],
      "screenId": "",
      "knownTemplateIds": []
    }
  }
}'
```

Look for the `https://lnkd.in/…` link inside `data` (JSON or RSC text). This simplified request still needs live validation.