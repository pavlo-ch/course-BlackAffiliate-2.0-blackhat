# Creating and Configuring a Split Flow

In this article, we’ll walk you through how to create a new split flow in your AppCraft dashboard and set up rules for flexible traffic management.

### Step 1. General Flow Settings

First, you need to configure the default rule. The default rule is a fallback scenario that works only if none of the other rules match.

![image](/img/5.7/image1.png)

**Steps:**

1. Go to the Splits section and click Create split.  
2. Select an existing pixel or create a new one.  

![image](/img/5.7/image1.png)

3. Configure GEO cloaking.  

**Important**  
Cloaking applies to the entire flow, including the default scenario and all rules.

- **No GEO cloaking**: users are not filtered.  
- **GEO cloaking**: users from specified countries will see the main content, others will see the whitepage.  
- To use your own whitepage instead of the standard one from AppCraft, enter its URL in the Whitepage Source field.

![image](/img/5.7/image2.png)

4. Specify the offer/tracker link.  
   * If the user doesn’t match any rule, they will be redirected directly to the specified offer/tracker, without using apps.

![image](/img/5.7/image3.png)

5. Optionally, add a comment for convenience.  
6. Click Save.  

The split flow is created. Now you can set up rules for more precise traffic control.

### Step 2. Adding Rules

Rules allow you to set display conditions for specific user groups.

1. Click Add Rule.  
2. Give the rule a name.  

![image](/img/5.7/image4.png)

3. Set the trigger conditions:  
   - **By GEO** – the rule applies only to users from the selected countries. You can specify one or multiple countries.  

![image](/img/5.7/image4.png)

   - **By Platform** – iOS or Android.  

**Heads up**  
In rules, you can select both iOS and Android as target platforms. However, the system does not validate whether the chosen app matches the user’s actual platform.

Here’s what that means:

- If a rule targets both iOS and Android, but only an iOS app is added, Android users will still be sent to the iOS app.  
- If only an Android app is added, iPhone users will see the Android app as well.  

So, make sure you pick apps carefully when setting up rules. If you want to target for each platform, add apps for both iOS and Android.

   - **By Sub** – set a value that the system will look for. The rule only triggers if the user’s link contains this parameter.

**Example**  
Condition `sub10 = test10` is set → this means you need to add the parameter `sub10=test10` to the final link. The system will then match the parameter and send the user according to this rule.

If the sub is not specified in the final link or has a different value, the system will skip this rule and continue checking other rules in order from top to bottom.

4. Click Add split. Select one or more apps for this rule:

- You can combine apps for different platforms in a single rule.  
- Pre-landing is configured separately for each app.  
- Set the traffic distribution ratio between apps.  
- Click Save.  

Add as many rules as needed for your tasks. Once done, the split flow will start distributing traffic according to the defined logic.

### Rule Priority and Order

All added rules appear in a list and have a unique ID.

- Rules are processed from top to bottom: the higher the rule in the list, the higher its priority.  
- If the top rule matches, the rest are ignored.  
- To temporarily disable a rule, use the toggle next to it.  
- To change the order, drag and drop rules.  

**Important:** If no rules match, the user is sent to the offer specified in the default settings.

### Using Macros in Splits

You can add macros to the final link:

- `{rule_id}` — inserts the ID of the triggered rule.  
- `{rule_name}` — inserts the name of the triggered rule.  

**Example:**

`https://example.com?sub1={exid}&sub2={rule_id}&sub3={rule_name}`

All main settings are done, and the split flow is ready to work. You can always return to the split flow to edit rules as needed.