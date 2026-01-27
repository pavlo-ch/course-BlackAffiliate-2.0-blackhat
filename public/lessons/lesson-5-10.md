# Tracker Integration

To set up data exchange between your tracker and **App Craft**, follow these steps:

## Passing Parameters

To send data correctly to App Craft, you need to set up the parameters being passed. Depending on your strategy, you can pass parameters either via a simple link or using naming.

### Sending Parameters via Link

In your traffic source settings, add parameters to send data. You can use any names, like `sub1`, `subid1`, or `token1`. These are optional for App Craft to work.

Make sure to include a unique ID `{exid}`. This is **required** and should be the first parameter in the link.

**Example link with parameters:**
```
https://example.com?sub1={exid}&sub2={sub2}&sub3={sub3}
```

#### App Bundle in the link

You can automatically send the app's bundle ID to the tracker. Just use the `bundle` macro in one of the parameters.

```
https://example.com?sub1={exid}&sub2={sub2}&sub3={sub3}&sub4=bundle
```

The bundle parameter won't show in the final link but will be sent to the tracker.

### Sending Parameters via Naming

If you're using naming, you can add dynamic parameters into the link. This helps track where the traffic came from and which campaign it belongs to.

**Example of such a link:**
```
https://domain.com/{subX}?sub1={exid}&sub3={sub3}&sub4={sub4}&sub5={sub5}
```

where:

- `{subX}` – a dynamic part of the link, replaced by the campaign ID or other label.
- `{exid}` – a unique identifier.
- `{sub3}`, `{sub4}`, `{sub5}` – extra parameters if you want to send more data.

Once your link is ready, you can set the campaign key in the naming.

**Example:**
```
rent://12a34567/subX={campaignid}/sub3={sub3}/sub4={sub4}/sub5={sub5}
```

#### App Bundle in Naming

You can also pass app info to the tracker using the `bundle` macro. Just add `bundle` to both the tracking link and the naming.

**Example:**

**Link:**
```
https://example.com?sub1={exid}&sub2={sub2}&sub3={sub3}&sub4=bundle
```

**Naming:**
```
rent://12a34567/sub2={sub2}/sub3={sub3}/sub4=bundle
```

## Setting Up Postback

Add the postback URL in your tracker settings:

**App Craft postback URL:**
```
https://tools.appcraft.mobi/pb/?exid={token}&action={status}
```

Replace `{token}` with the macro that holds the exid.
Depending on your tracker, this macro could be named `sub1`, `click_id`, or another parameter that holds the user ID.

**Example:**
If you're using `sub1` for exid, the link would be:
```
https://tools.appcraft.mobi/pb/?exid={sub1}&action={status}
```

Replace `{status}` with the conversion status. Currently, App Craft accepts:

- **`reg`** – for registration

**Postback example for registration:**
```
https://tools.appcraft.mobi/pb/?exid={token}&action=reg
```

- **`dep`** – for deposit

**Postback example for deposit:**
```
https://tools.appcraft.mobi/pb/?exid={token}&action=dep
```

Make sure this postback URL is added to your traffic source or campaign settings.

![postback url](/img/5.10/image2.png)

> **Info**  
> For better tracking, you can also send deposit amount and currency.

**Parameters:**

![Parameters](/img/5.10/image1.png)

- `payout` – amount paid
- `currency` – currency used (USD, EUR, etc.)

**Example postback with amount and currency:**
```
https://tools.appcraft.mobi/pb/?exid=abc12345&action=dep&payout=1.05&currency=EUR
```

## Integration Examples

Settings may vary depending on the tracker. We've prepared guides for popular platforms:

- **Binom**
- **Keitaro**
- **Voluum**

Choose your tracker and follow the setup guide.