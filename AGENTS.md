# Development Context: roslibjs Migration (v2.1.0+)

## ⚠️ Critical Change: Removal of `ServiceRequest`, `ServiceResponse`, and `Message`

Starting with `roslib` v2.1.0 (following the complete migration to TypeScript), the `ServiceRequest`, `ServiceResponse`, and `Message` classes have been **permanently removed** from the library.

Attempting to import them will cause TypeScript errors such as:

```text
Module '"roslib"' has no exported member 'ServiceRequest'.
Module '"roslib"' has no exported member 'ServiceResponse'.
Module '"roslib"' has no exported member 'Message'.
```

## 🛠️ How to Interact with Services in roslib v2.1.0+

There is no longer any need to instantiate container classes such as `ServiceRequest` or `ServiceResponse`.

Service requests and responses are represented as **plain JavaScript objects (JSON)**.

### Example: Calling a Service

```typescript
import { Ros, Service } from 'roslib';

// 1. Configure the service client normally
const myService = new Service({
  ros: ros,
  name: '/add_two_ints',
  serviceType: 'rospy_tutorials/AddTwoInts'
});

// 2. Define the request as a plain object
//    DO NOT instantiate ServiceRequest
const requestData = {
  a: 5,
  b: 10
};

// 3. Pass the object directly to callService
myService.callService(
  requestData,
  (result) => {
    console.log('Service result:', result);
  },
  (error) => {
    console.error('Error calling service:', error);
  }
);
```

### Example: Service Without Parameters

If a service does not require any input parameters, pass an empty object:

```typescript
myService.callService(
  {},
  (result) => {
    console.log('Response:', result);
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

### Example: Handling a Service Response

The result received by `callService` is also a **plain object**, so **DO NOT instantiate `ServiceResponse`**.

For example, if the service has the following response:

```text
int64 sum
```

The response can be accessed directly:

```typescript
myService.callService(
  { a: 5, b: 10 },
  (result) => {
    console.log(result.sum);
  }
);
```

Do NOT do this:

```typescript
// ❌ INCORRECT
import { ServiceResponse } from 'roslib';

const response = new ServiceResponse({
  sum: 15
});
```

Simply use the object received by the callback:

```typescript
// ✅ CORRECT
(result) => {
  console.log(result.sum);
}
```

---

## 📡 How to Publish Messages to Topics

The same rule applies to ROS messages.

In `roslib` v2.1.0+, **DO NOT import or instantiate `Message`**.

Messages must be constructed as **plain JavaScript objects** that match the structure defined by the ROS message type.

### Example: Publishing a `std_msgs/String` Message

```typescript
import { Topic } from 'roslib';

const topic = new Topic({
  ros: ros,
  name: '/chatter',
  messageType: 'std_msgs/String'
});

// Plain object, WITHOUT instantiating Message
const message = {
  data: 'Hello ROS!'
};

topic.publish(message);
```

Do NOT do this:

```typescript
// ❌ INCORRECT
import { Message } from 'roslib';

const message = new Message({
  data: 'Hello ROS!'
});

topic.publish(message);
```

Do this instead:

```typescript
// ✅ CORRECT
const message = {
  data: 'Hello ROS!'
};

topic.publish(message);
```

### Example: Message with Multiple Fields

If the ROS message type contains multiple fields, the object must match its structure.

For example, for a message equivalent to:

```text
string name
int32 age
bool active
```

Publish it as:

```typescript
const message = {
  name: 'Robot',
  age: 5,
  active: true
};

topic.publish(message);
```

There is no need to create a `Message` instance.

---

## 🧩 General Rule

In `roslib` v2.1.0+, ROS data used for **service requests, service responses, and topic messages** is represented directly using plain JavaScript objects.

| Case             | ❌ Do NOT use               | ✅ Use                           |
| ---------------- | -------------------------- | ------------------------------- |
| Service Request  | `new ServiceRequest(...)`  | `{ ... }`                       |
| Service Response | `new ServiceResponse(...)` | Object received by the callback |
| Topic Message    | `new Message(...)`         | `{ ... }`                       |

### Conceptual Example

For a service:

```text
Request:
int64 a
int64 b

Response:
int64 sum
```

The interaction should be:

```typescript
// Request
const request = {
  a: 5,
  b: 10
};

myService.callService(request, (response) => {
  // Response
  console.log(response.sum);
});
```

For a topic:

```text
string data
```

The message should be published as:

```typescript
const message = {
  data: 'Hello ROS!'
};

topic.publish(message);
```

## Rules for the Agent

1. **Never** attempt to import or use `ServiceRequest` from `roslib` in this project.
2. **Never** attempt to import or use `ServiceResponse` from `roslib` in this project.
3. **Never** attempt to import or use `Message` from `roslib` in this project.
4. When sending data to services, always use **plain JavaScript objects** whose structure matches the ROS service request type.
5. When publishing to topics, always use **plain JavaScript objects** whose structure matches the ROS message type.
6. Responses received through `callService` must be handled directly as **plain objects**; do not convert them into `ServiceResponse`.
7. If a service does not require parameters, pass an empty object `{}` to `callService`.
8. **Do not invent or create wrapper classes** to represent ROS messages, requests, or responses. The object's structure must directly correspond to the ROS type definition.
