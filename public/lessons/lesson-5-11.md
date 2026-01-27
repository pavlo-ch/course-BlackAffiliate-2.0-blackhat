# Voluum Integration

Go to the **Traffic sources** section ➜ **Create** ➜ **Create custom traffic source**.

In the **Parameters** section, specify the name `exid` and the macro `{exid}` for the External ID parameter.

![Voluum traffic source setup](/img/5.11/image1.png)

## Optional payout and currency parameters

For more accurate analytics, you can optionally pass the deposit amount and transaction currency.

**Parameters:**

- `payout` – deposit amount
- `currency` – transaction currency (e.g., USD, EUR)

**Example postback with payout and currency:**
```
https://tools.appcraft.mobi/pb/?exid=abc12345&action=dep&payout=1.05&currency=EUR
```

## Setting up postbacks

Go to **Passing conversion info to traffic source** and select **Traffic source postback URL per event type**.

Set up postbacks for conversion statuses:

- For **registration**, select **download**: 
  ```
  https://tools.appcraft.mobi/pb/?exid={externalid}&action=reg
  ```

- For **deposit**, select **sell**: 
  ```
  https://tools.appcraft.mobi/pb/?exid={externalid}&action=dep
  ```

![Voluum postback configuration](/img/5.11/image2.png)

Now, **Voluum** will send data to **AppCraft** and track conversions. Make sure that all parameters are passed correctly by testing the traffic before launching.