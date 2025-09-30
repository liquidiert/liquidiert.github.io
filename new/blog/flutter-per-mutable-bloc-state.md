---
title: An Introduction to Persistent Mutable BLoC State
thumb: img/live_cells_og.webp
og: img/live_cells_og.webp
date: 2025-09-30
---

In the world of Flutter development, the BLoC (Business Logic Component) pattern is a popular choice for managing state. Its core principle is to separate presentation from business logic, which makes your code faster, easier to test, and more reusable. With a simple setup and a strong community ecosystem, BLoC is a very powerful tool.

However, it's not without its challenges. One of the primary catches with the standard BLoC implementation is how it handles widget tree updates. Often, a small change in state can trigger a rebuild of a large portion of the widget tree, which can be inefficient.

This is where a different approach can make a significant impact. Let's explore a method for creating more selective and efficient widget updates in your BLoC applications.

## The "Live Cells" Library

To tackle the challenge of inefficient tree updates, we can use a reactive programming library called [Live Cells](https://pub.dev/packages/live_cells).

Live Cells is a reactive library that enables a two-way data flow directly within the widget tree. You can think of a "cell" as an observable value holder. When the value inside a cell changes, only the specific widgets observing that cell are rebuilt.

Here’s a brief look at how it works:

1. *Define a cell*: A cell is a (mutable) variable that holds your state. It can be any type of data, such as an integer, string, or even a complex object.

``` dart
// Define a mutable cell holding an integer
final count = MutableCell(0);

// Define a mutable cell holding a string
final content = MutableCell('');
```

2. *Define an observer*: You can watch a cell for changes and trigger actions. When the cell's value is updated, the observer automatically runs.

``` dart
// This observer will run whenever the value of 'count' changes
ValueCell.watch(() {
  print('${count()}');
});
```
3. *Update a cell's value*: You can change the value of a cell, which will in turn trigger any observers.

``` dart
// Increment the cell's value, which calls the observer
count.value++;
```

4. *Bind to Widgets*: Use special widgets like CellWidget.builder or LiveTextField to bind UI components directly to cells. This ensures that only these specific widgets redraw when the cell's value changes.

``` dart
Column(
  children: [
    // LiveTextField is directly bound to the 'content' cell
    LiveTextField(
      content: content
    ),

    // This CellWidget will only rebuild when 'content' changes
    CellWidget.builder(() =>
      Text('You wrote: ${content()}')
    )
  ]
)
```

## The Main Idea: Per-Mutable BLoC States

So, how does this connect back to BLoC? The core idea is to change our BLoC states to use `MutableCells` as state variables.

Instead of having a state class with plain, immutable properties, we define a state where the properties themselves are `MutableCell` objects.

Consider this `CellsDone` state class:

``` dart
// The state class itself
class CellsDone extends CellsState {
  // Instead of a final MyImmutableClass, we have a final MutableCell
  // that HOLDS a MyImmutableClass.
  final MutableCell<MyImmutableClass> imConstantlyChanging;
  
  // ... other state code
}

// The data class that the cell holds
class MyImmutableClass {
  final String name;
  final String ietsAnders;

  MyImmutableClass({
    required this.name,
    required this.ietsAnders,
  });
}
```

By doing this, the BLoC state object itself (`CellsDone`) remains the same. We are not emitting new states from the BLoC. Instead, we are changing the inner value of the `MutableCell` that the state holds. This allows us to get more efficient tree updates and write less state-handling code.

## The Difference in Practice: A Code Comparison
Let's compare the traditional BLoC approach with the per-mutable cell approach to see the benefits.

### Without Cells: The Standard BLoC Approach

In a typical BlocBuilder, any change to the state forces the entire builder to run again.

``` dart
// Standard BlocBuilder setup
BlocBuilder<CellsCubit, CellsState>(
  (context, cellState) {
    if (cellState is! CellsDone) {
      // Loading indicator / error handling
    }

    return Column(
      children: [
        TextField(
          label: Text("Name"),
          onChanged: (value) =>
            // This rebuilds the WHOLE widget tree inside the BlocBuilder
            context.read<CellsCubit>.updateName(value),
        ),
        Text(cellState.imConstantlyChanging.name),

        TextField(
          label: Text("Iets Anders"),
          onChanged: (value) =>
            // This ALSO rebuilds the whole tree
            context.read<CellsCubit>.updateIets(value),
        ),
        Text(cellState.imConstantlyChanging.ietsAnders),
      ],
    );
  }
);
```

In this example, typing in either `TextField` triggers an event, creates a new state, and causes the entire Column to be rebuilt, even the widgets that haven't changed.

### With Cells: The Per-Mutable State Approach

By combining `BlocBuilder` with `CellWidget.builder`, we can achieve much more granular control.

``` dart
BlocBuilder<CellsCubit, CellsState>( 
  (context, cellState) {
    if (cellState is! CellsDone) {
      // Loading indicator / error handling
    }
    
    // CellWidget.builder ensures only its children rebuild on demand
    return CellWidget.builder(
      (_) => Column(
        children: [
          // LiveTextField is directly bound to the cell's property
          LiveTextField(
            content: cellState.imConstantlyChanging.name,
            label: Text("Name"),
          ),
          // This Text widget will ONLY update when the 'name' property changes
          Text(cellState.imConstantlyChanging.name()),

          // LiveTextField bound to the other property
          LiveTextField(
            content: cellState.imConstantlyChanging.ietsAnders,
            label: Text("Iets Anders"),
          ),
          // This Text widget will ONLY update when 'ietsAnders' changes
          Text(cellState.imConstantlyChanging.ietsAnders()),
        ],
      )
    );
  }
);
```

Here, the `BlocBuilder` is only responsible for high-level state changes (like switching from a loading state to a done state). Once in the `CellsDone` state, the `CellWidget.builder` takes over. Now, when you type in the "Name" `LiveTextField`, only the `Text` widget bound to the name property is rebuilt. The rest of the UI remains untouched, resulting in less time spent on rebuilds and less state management code!