# Understanding Postbacks for Traffic Arbitrage

<div class="mb-8" style="aspect-ratio: 16/9;">
  <iframe class="w-full h-full rounded-lg" src="https://www.youtube.com/embed/GXckvS6rwyg?si=g9Yb4se_2yvtcgNV" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>



## What Are Postbacks and How Do They Work?

Postbacks are a powerful mechanism that lets you capture critical event data (like registrations or deposits) from advertisers or affiliate networks and relay it to other platforms, such as app rental services. This automated data exchange boosts your campaign tracking and optimization. Here’s the breakdown:

1. **ClickID Transmission**: When a user clicks your ad link, a unique ClickID is embedded in the URL and sent to the affiliate network, marking the start of the user journey.  
2. **Event Tracking**: Once the user completes an action (e.g., signing up or depositing), the affiliate network logs this event.  
3. **Data Return via Postback**: The network sends a request to a predefined postback URL, including the ClickID and event details (e.g., registration status or deposit amount). This data is then recorded in your system for further use.

**Example**: If your ad link includes sub1={clickid}, the affiliate network replaces it with a unique ClickID (e.g., sub1=123456). Upon a successful registration, the network pings your postback URL like this:

```
https://your_domain.com/postback?clickid=123456&event=registration
```

## Extending Data Flow

Take your tracking to the next level by sharing this data with external tools. For instance, if you’re using an app rental service like App Craft alongside Facebook ads:

* **Data Reception**: Your system logs the registration from the affiliate network.  
* **Forwarding to App Rental**: In the S2S Postback settings, configure data transfer to App Craft, which automatically handles the relay.  
* **Facebook Optimization**: App Craft sends the registration info to Facebook, enabling its algorithm to refine ad targeting and improve ROI.

This seamless data pipeline automates conversion tracking, helping you scale campaigns efficiently while dodging manual updates.

**Pro Tip**: Ensure your postback URLs are secure and test them with App Craft to confirm data flows correctly, especially during Facebook’s strict moderation phases.

