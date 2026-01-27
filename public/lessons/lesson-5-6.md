# Splits: General Information and Features

Split flows allow you to manage traffic based on specified conditions or rules. They enable flexible audience segmentation by country and platform used (iOS, Android). If no rule matches, the traffic is directed straight to the specified offer.

![image](/img/5.6/image1.png)

### Main Components of a Split Flow

1. Default rule  
   * The basic scenario triggered if the user does not meet any of the created rules.

2. Rules  
   * A set of conditions that, when met, direct the user to selected applications.

3. GEO cloaking  
   * A feature that allows hiding content from users in certain countries by showing them a whitepage instead.

4. Split  
   * The ability to set proportions for how traffic is divided between different apps within a rule.

### How It Works

1. The user visits the split flow link.  
2. The system sequentially checks the rules from top to bottom.  
3. If a rule’s conditions are met, the user is directed according to that rule, and other rules are ignored.  
4. If no rule matches, the default rule is applied, i.e., direct redirect to the offer.

### How to Manage Split Flows

All split flows are located in the Splits section of the AppCraft personal account. There you can:

* Create new split flows.  
* View the list and statistics of existing ones.  
* Edit settings and rules.
