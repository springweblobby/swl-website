
/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author cc
 * @license GPL 2
 */

package com.springrts.unitsync;


import com.springrts.unitsync.impl.jna.UnitsyncImpl;
import com.sun.jna.Library;
import com.sun.jna.Native;
import java.applet.Applet;
import java.awt.HeadlessException;
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.*;
import java.util.prefs.Preferences;
import java.util.regex.Matcher;

//import javax.swing.JApplet;

//public class UnitsyncApplet extends JApplet {
public class WeblobbyApplet extends Applet {
    
    private Map<String, Process> processes = new HashMap<String, Process>();
    private String os;
    private String springHome;
    private String slash;
    private JavaSocketBridge javaSocketBridge = new JavaSocketBridge(this);

    public WeblobbyApplet()
    {
        springHome = "";
    }

    public void init() throws HeadlessException 
    {
        final String os = System.getProperty("os.name").toLowerCase();
                
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                if(os.indexOf("win") >= 0) setOs("Windows");
                else if(os.indexOf("nux") >= 0) setOs("Linux");
                else if(os.indexOf("mac") >= 0) setOs("Mac");
                return null;
            }
        });
    }
    
    public boolean connect(final String url, final int p)
    {
        return (Boolean)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                return javaSocketBridge.connect(url, p);
            }
        });
        //return this.javaSocketBridge.connect(url, p);
    }
    public boolean disconnect()
    {
        return this.javaSocketBridge.disconnect();
    }
    public boolean send(String message)
    {
        return this.javaSocketBridge.send(message);
    }
    
    public String listDirs( final String path )
    {
        return this.listFilesPriv(path, true);
    }
    public String listFiles( final String path )
    {
        return this.listFilesPriv(path, false);
    }
    
    private String listFilesPriv( final String path, final boolean dirs )
    {
        ArrayList<String> files = (ArrayList<String>)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                File folder = new File(path);
                File[] listOfFiles = folder.listFiles(); 
                List<String> files = new ArrayList<String>();

                for (int i = 0; i < listOfFiles.length; i++) 
                {
                    if( dirs )
                    {
                        if (listOfFiles[i].isDirectory()) 
                        {
                            files.add(listOfFiles[i].getName());
                        }
                    }
                    else
                    {
                        files.add(listOfFiles[i].getName());
                    }
                }
                return files;
            }
        });
        String out = "";
        if( files.size() > 0 )
        {
            out += files.remove(0);
            for(String file : files)
            {
                out += "||" + file;
            }
        }

        return out;
    }
    
    public void createScript(String scriptFile, String script)
    {
        this.createScriptFile(scriptFile, script);
    }
    
    public UnitsyncImpl getUnitsync(final String unitsyncPath) {
        //running echoJs anywhere in this function breaks it. (linux confirmed)
        
        //NativeLibrary.addSearchPath("unitsync", unitsyncPathFull);
        //Preferences.userRoot().put("unitsync.path", "unitsync");
        final WeblobbyApplet weblobbyApplet = this;
        UnitsyncImpl unitsync = AccessController.doPrivileged(new PrivilegedAction<UnitsyncImpl>() {
            public UnitsyncImpl run() 
            {
                try
                {   
                    //echoJs("unitsyncPathFull = " + unitsyncPathFull);
        
                    File f = new File(unitsyncPath);
                    {
                        if( !f.exists() )
                        {
                            return null;
                        }
                    }
                    /** /
                    Preferences.userRoot().put("unitsync.path", unitsyncPathFull);
                    return new UnitsyncImpl();
                    /**/
                    UnitsyncImpl test = new UnitsyncImpl( unitsyncPath, weblobbyApplet );
                    return test;
                    
                }
                catch (Exception e) 
                {
                    WriteToLogFile( e );
                    return null;
                }
            }
        });
        return unitsync;
    }
    
    public int[] jsReadFileVFS(String unitsyncPath, int fd, int size)
    {
        byte[] bytes = new byte[size];
        ByteBuffer buff = ByteBuffer.wrap(bytes);
        int bytesRead;
        bytesRead = this.getUnitsync(unitsyncPath).readFileVFS(fd, buff, size );
        //this.echoJs( buff.toString() );
        this.echoJs( "Bytes read: " + bytesRead );
        byte[] byteArray = buff.array();
        int[] ints = new int[ byteArray.length ];
        for (int i = 0; i < byteArray.length; ++i) 
        { 
            ints[i] = (int)byteArray[i];
        }
        return ints;
    }

    
    
    public boolean killCommand( final String cmdName )
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                Process p = processes.get(cmdName);
                if( p != null )
                {
                    p.destroy();
                }
                return null;
            }
        });
        return true;
    }
    
    
    private void setOs(String os)
    {
        this.os = os;
        File f;
        this.slash = os.equals("Windows") ? "\\" : "/";
        if( springHome != "" );
        else if( os.equals("Windows") )
        {
            springHome = System.getProperty("user.home") + "\\Documents\\My Games\\Spring";
        }
        else if( os.equals("Mac") || os.equals("Linux")  )
        {
            springHome = System.getProperty("user.home") + "/.spring";
        }
        else
        {
            return;
        }
        f = new File( springHome );
        f.mkdirs();
        if(!f.isDirectory())
        {
		doJs("alert('Cannot access spring home folder " + jsFix(springHome) + "\nApparently, automatic detection has failed. Please set the correct one in settings.');");
        }
        
        String weblobbyHome = springHome + this.slash + "weblobby";
        
        f = new File( weblobbyHome + this.slash + "engine" );
        f.mkdirs();
        
        f = new File( weblobbyHome + this.slash + "pr-downloader" );
        f.mkdirs();
        
        f = new File( weblobbyHome + this.slash + "logs" );
        f.mkdirs();
    }
    
    public String getSpringHome()
    {
        return this.springHome;
    }

    // Should be called prior to init() to take effect.
    public void setSpringHome(final String path)
    {
	this.springHome = path;
    }
    
    public void createDir(final String path)
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                File f = new File( path );
                f.mkdir();
                return null;
            }
        });
    }
    
    public void runCommand( final String cmdName, final String[] cmd )
    {
        /*
         * Chromium Bug:
         * cmd is coming in as a string(?) instead of as an array of strings. 
         * Appears fine in javascript but not in this function
         * Chromium only, not Windows Chrome
         */
        /*
        echoJs( "begin runCommand1: " );
        echoJs( "begin runCommand2: " + cmd );
        echoJs( "begin runCommand3: " + cmd[0] );
        */
       
        new Thread(new Runnable() {
                public void run() {
                    runCommandThread(cmdName, cmd);
                } 
        }).start(); //new Thread(new Runnable() {
    }
    
    private void createScriptFile(final String scriptFile, final String script)
    {
         AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Creating script: " + scriptFile );
                try
                {   
                    PrintWriter out = new PrintWriter( scriptFile );
                    echoJs( "Writing to script file: " +  scriptFile );
                    out.print(script);
                    out.close();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    
    public void createUiKeys(final String path)
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Creating empty uikeys: " + path );
                try
                {   
                    PrintWriter out = new PrintWriter( path );
                    out.print("");
                    out.close();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    public void deleteSpringSettings(final String path)
    {
        if( !path.endsWith("springsettings.cfg") )
        {
            echoJs( "Delete SpringSettings error: " + path );
            return;
        }
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Delete SpringSettings: " + path );
                try
                {   
                    File f = new File( path );
                    f.delete();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    
    public String jsFix(String str)
    {
        str = str.replace("\\", "\\\\");
        str = str.replace("'", "\\'");
        return str;
    }
    
    private void setupEnvironment( ProcessBuilder pb )
    {
        pb.environment().put( "OMP_WAIT_POLICY", "ACTIVE" );
    }
    
    private void runCommandThread( final String cmdName, final String[] cmd )
    {
        if( cmd[0].contains( "pr-downloader" ) )
        {
            //String newCmd = this.springHome + this.slash + "pr-downloader" + this.slash + "pr-downloader";
            //cmd[0] = cmd[0].replace( "pr-downloader", newCmd );
        }
        else if(cmd[0].toLowerCase().contains( "spring" ) )
        {
            this.echoJs( "Starting Spring shortly... " +  cmd[0] );
        }
        else if(cmd[1].toLowerCase().contains( "spring" ) )
        {
            this.echoJs( "Starting Spring shortly... " +  cmd[0] + " " + cmd[1] );
        }
        else
        {
            this.echoJs( "Bad command." );
            return;
        }
        
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                if( processes.get(cmdName) != null )
                {
                    return null;
                }
                try
                {
                    //echoJs( "running command... " + cmd[0] );
                    
                    /*
                    Runtime runtime = Runtime.getRuntime();
                    Process pr = runtime.exec( cmd2 );
                    */
                    
                    ProcessBuilder builder = new ProcessBuilder(cmd);
                    builder.redirectErrorStream(true);
                    setupEnvironment( builder );
                    Process pr = builder.start();
                    
                    processes.put(cmdName, pr);
                    
                    BufferedReader buf = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                    
                    String line = "";
                   
                    while ((line=buf.readLine())!=null) 
                    {
                        doJs("commandStream('"+ jsFix(cmdName) +"', '"+jsFix(line)+"')");
                    }
                    processes.remove(cmdName);
                    doJs("commandStream('exit', '"+jsFix(cmdName)+"')");
                        
                }
                 
                catch (Exception e) 
                {
                    WriteToLogFile( e );
                    
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                       echoJs( e.getStackTrace()[i]+"" ); 
                    }
                }
                
                
                return null;
            }
        });//AccessController.doPrivileged(new PrivilegedAction() { 
    }
    
    
    private void WriteToLogFile( Exception e )
    {
        String logFile = this.springHome + this.slash + "WebLobbyLog.txt" ;
        try
        {   
            PrintWriter out = new PrintWriter( logFile );
            echoJs( "Error. Writing to log file: " +  logFile );
            out.println( "Begin log file.\n" );   
            
            e.printStackTrace( out );
            
            out.close();
        }
        catch(Exception e2)
        {
            echoJs( "Log file ("+logFile+") not found: " + e2.toString() );
        }
                                
    }
    
    public boolean WriteToFile( final String logFile, final String line )
    {
        return (Boolean)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {   
                    PrintWriter out = new PrintWriter(new FileWriter(logFile, true));
                    out.println(line);
                    out.close();
                }
                catch(Exception e)
                {
                    echoJs( "Problem writing to log file ("+logFile+"): " + e.toString() );
                    return false;
                }
                return true;
            }
        });                     
    }
    
    public String ReadFileLess( final String logFile, final int numLines )
    {
        return (String)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {   
                    File f = new File(logFile);
                    if(!f.exists()) 
                    { 
                        return "";
                    }
                    String lessOut = "";
                    Stack<String> lessOutList = new Stack<String>();
                    BufferedReader br = null;
                    br = new BufferedReader(new FileReader(logFile));
                    String curLine;
 
                    while ((curLine = br.readLine()) != null) 
                    {
                        lessOutList.push(curLine);
                    }
                    
                    for(int i=1; i <= numLines && !lessOutList.empty() ; i++ ) 
                    {
                        lessOut = lessOutList.pop() + "\n" + lessOut;
                    }
                    return lessOut;
                }
                catch(Exception e)
                {
                    echoJs( "Problem reading from log file ("+logFile+"): " + e.toString() );
                    return "";
                }
            }
        });                     
    }
    
    
    public void echoJs(String out )
    {
        out = jsFix(out);
        doJs( "console.log('<Java> " + out + "'); ");
    }
    
    public void doJs( String jscmd )
    {
	jscmd = "__java_js_wrapper(function(){" + jscmd + "}, this);";
        String jsresult = null;
        boolean success = false;
        try {
        Method getw = null, eval = null;
        Object jswin = null;
        Class c = Class.forName("netscape.javascript.JSObject"); /* does it in IE too */
        Method ms[] = c.getMethods();
        for (int i = 0; i < ms.length; i++) {
            if (ms[i].getName().compareTo("getWindow") == 0)
                getw = ms[i];
            else if (ms[i].getName().compareTo("eval") == 0)
                eval = ms[i];
            
        }
        Object a[] = new Object[1];
        a[0] = this;               /* this is the applet */
        jswin = getw.invoke(c, a); /* this yields the JSObject */
        a[0] = jscmd;
        Object result = eval.invoke(jswin, a);
        if (result instanceof String)
            jsresult = (String) result;
        else
            jsresult = result.toString();
        success = true;
        }

        catch (InvocationTargetException ite) {
        jsresult = "" + ite.getTargetException();
        }
        catch (Exception e) {
        jsresult = "" + e;
        }

        if (success)
            System.out.println("eval succeeded, result is " + jsresult);
        else
            System.out.println("eval failed with error " + jsresult);
    }   
    
    public boolean downloadFile(final String source, final String target)
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                downloadFilePriv(source, target );
                return null;
            }
        });
        return true;
    }
     
    public boolean downloadFilePriv(String source, String target)
    {
        try
        {
            echoJs("Copy file: " + source + " > " + target );
            URL dl = new URL( source );
            ReadableByteChannel rbc = Channels.newChannel(dl.openStream());

            FileOutputStream fos = new FileOutputStream( target );
            fos.getChannel().transferFrom(rbc, 0, 1 << 24);
            //System.out.println(fos.getChannel().size());
            fos.close();
            rbc.close();
            
            if( target.endsWith("pr-downloader") )
            {
                CLibrary libc = (CLibrary) Native.loadLibrary("c", CLibrary.class); //breaks applet on windows
                /*
                Path targetFile = Paths.get(target); // fails on Linux
                Set<PosixFilePermission> perms = PosixFilePermissions.fromString("rwxr-x---");
                Files.setPosixFilePermissions(targetFile, perms);
                */
                libc.chmod(target, 0750);
            }

        }
        catch( Exception e )
        {
            echoJs("URL error 2 " + e.toString());
            for(int i=0; i<e.getStackTrace().length; i++)
            {
                echoJs( e.getStackTrace()[i]+"" );
            }
            return false;
        }
        return true;
    }

    interface CLibrary extends Library {
        public int chmod(String path, int mode);
    }

}



