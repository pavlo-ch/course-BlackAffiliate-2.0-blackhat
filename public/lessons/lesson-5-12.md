# Traffic Split Between Campaigns in Trackers

If you need to split traffic between campaigns in your tracker for a single **iOS link** or **Android naming convention**, you will need to create a general campaign in your tracker. This campaign will be responsible for routing traffic to the appropriate campaigns.

The main principle of this setup is to use one of the link parameters (**subs**) as a basis for splitting traffic. Below, we will walk through the configuration process using **Keitaro** and **Binom** as examples.

## Configuring Traffic Split in Keitaro

1. Create a general campaign in your tracker.

2. Set up a flow by clicking **Create flow**.

3. Configure the flow:
   - Enter a name in the **Name** field.
   - Select the flow type: **Forced**.

4. Define the flow schema:
   - Go to the **Schema** tab.
   - In the **Action** dropdown, select **Send to campaign**.
   - From the **Campaign** list, choose the campaign to which the traffic should be routed.

![Keitaro flow schema configuration](/img/5.12/image1.png)

5. Add filters:
   - Navigate to the **Filters** tab.
   - In the **Add filter** dropdown, select the parameter that will be used for splitting traffic (for example, `sub_id_1`).
   - Specify the parameter value for the current flow.

![Keitaro filters configuration](/img/5.12/image2.png)

6. Repeat this process for each target campaign where traffic needs to be routed.

7. Add a fallback flow with the type **Default** to handle traffic that does not meet any specified rules.
> **Important**  
> To ensure the integration works correctly, it is recommended to use **Keitaro version 11** or higher. Earlier versions may not support some of the functionality described in this guide.

## Configuring Traffic Split in Binom

1. Select a token to pass the **Buyer ID** in the **Traffic Source Settings**.

![Binom traffic source settings](/img/5.12/image3.png)

2. Create a general campaign in your tracker.

3. Configure the **Default Path** to route traffic that does not match any specified rules.

![Binom default path configuration](/img/5.12/image4.png)

4. Set up rules for each **Buyer ID** in the **Rules** section:

![Binom rules section](/img/5.12/image5.png)

5. For each rule, configure the path as **Landing → Direct**.

6. In the **Offer** field, specify the campaign for the corresponding buyer.

![Binom offer configuration](/img/5.12/image6.png)