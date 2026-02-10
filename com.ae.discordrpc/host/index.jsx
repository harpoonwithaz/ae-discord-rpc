// function testConnection() {
//     return "After Effects 2020 is connected!";
// }

#target aftereffects
#targetengine "aeDiscordRpc"

function getAeContext() {
    var projectName = "Unsaved Project";
    var compName = "No Active Comp";

    try {
        if (app.project && app.project.file) {
            projectName = app.project.file.name;
        }
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            compName = app.project.activeItem.name;
        }
    } catch (err) {
        // Keep defaults on any error to avoid breaking the CEP panel.
    }

    return projectName + "||" + compName;
}
