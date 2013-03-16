
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
import com.sun.jna.NativeLibrary;
import java.applet.Applet;
import java.awt.HeadlessException;
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.HashMap;
import java.util.Map;
import java.util.prefs.Preferences;
import java.nio.ByteBuffer;
import java.util.regex.Matcher;

//import javax.swing.JApplet;

//public class UnitsyncApplet extends JApplet {
public class WeblobbyApplet extends Applet {
    
    private Map<String, Process> processes = new HashMap<String, Process>();
    private String os;
    private String springHome;
    private String slash;

    public WeblobbyApplet() throws HeadlessException 
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                String os = System.getProperty("os.name").toLowerCase();
                if(os.indexOf("win") >= 0) setOs("Windows");
                else if(os.indexOf("nux") >= 0) setOs("Linux");
                else if(os.indexOf("mac") >= 0) setOs("Mac");
                return null;
            }
        });
    }
    
    public UnitsyncImpl getUnitsync(final String unitsyncPath) {
        
        UnitsyncImpl unitsync = AccessController.doPrivileged(new PrivilegedAction<UnitsyncImpl>() {
            public UnitsyncImpl run() 
            {
                String unitsyncPathFull = pathFix( unitsyncPath );
                //NativeLibrary.addSearchPath("unitsync", unitsyncPathFull);
                //Preferences.userRoot().put("unitsync.path", "unitsync");
                Preferences.userRoot().put("unitsync.path", unitsyncPathFull);
                return new UnitsyncImpl();
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
                //echoJs( processes.get(cmdName).toString() );
                processes.get(cmdName).destroy();
                return null;
            }
        });
        return true;
    }
    
    
    private void setOs(String os)
    {
        this.os = os;
        File f;
        this.slash = "/";
        if( os.equals("Windows") )
        {
            this.slash = "\\";
            f = new File( System.getProperty("user.home") + "\\Documents\\My Games2" );
            f.mkdir();
            springHome = System.getProperty("user.home") + "\\Documents\\My Games2\\Spring";
            
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
        f.mkdir();
        
        f = new File( springHome + this.slash + "engine" );
        f.mkdir();
        
        f = new File( springHome + this.slash + "pr-downloader" );
        f.mkdir();
    }
    
    private String pathFix(String path)
    {
        return path.replaceAll("%springHome%", Matcher.quoteReplacement(springHome) );
    }
    
    public void createDir(final String path)
    {
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                File f = new File( pathFix( path ) );
                f.mkdir();
                return null;
            }
        });
    }
    
    public void runCommand( final String cmdName, final String[] cmd )
    {
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
                catch(FileNotFoundException e2)
                {
                    echoJs( "Script file ("+scriptFile+") not found: " + e2.toString() );
                }
                return null;
            }
         });
    }

    
    private void runCommandThread( final String cmdName, final String[] cmd )
    {
        if( cmd[0].contains( "pr-downloader" ) )
        {
            //String newCmd = this.springHome + this.slash + "pr-downloader" + this.slash + "pr-downloader";
            //cmd[0] = cmd[0].replace( "pr-downloader", newCmd );
        }
        else if(cmd[0].contains( "spring" ) || cmd[0].contains( "Spring" ))
        {
            this.echoJs( "Starting Spring shortly... " +  cmd[0] );
            String scriptFile = springHome + this.slash + "script.spring" ;
            this.createScriptFile(scriptFile, cmd[1]);
            cmd[1] = scriptFile;
        }
        else
        {
            return;
        }
        
        String temp = "";
        for(int i=0; i < cmd.length; i++)
        {
            String newPart = this.pathFix( cmd[i] );
            cmd[i] = newPart;
            temp += " || " + newPart;
        }
        echoJs("=========temp");
        echoJs(temp);
                
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {
                    //doJs( "console.log('<Java> " + cmd + " '); ");
                    Runtime runtime = Runtime.getRuntime();
                    Process pr = runtime.exec( cmd );
                    
                    processes.put(cmdName, pr);
                    BufferedReader buf = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                    
                    String line = "";
                   
                    while ((line=buf.readLine())!=null) 
                    {
                        line = line.replace("\\", "\\\\");
                        line = line.replace("'", "\\'");
                        doJs("commandStream('"+ cmdName +"', '"+line+"')");
                    }
                        
                }
                 
                catch (IOException e) 
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
        String logfile = this.springHome + this.slash + "WebLobbyLog.txt" ;
        try
        {   
            PrintWriter out = new PrintWriter( logfile );
            echoJs( "Error. Writing to log file: " +  logfile );
            out.println( "Begin log file.\n" );   
            e.printStackTrace( out );
            out.close();
        }
        catch(FileNotFoundException e2)
        {
            echoJs( "Log file ("+logfile+") not found: " + e.toString() );
        }
                                
    }
    
    private void echoJs(String out )
    {
        out = out.replace("\\", "\\\\");
        out = out.replace("'", "\\'");
        doJs( "console.log('<Java> " + out + "'); ");
    }
    
    public void doJs2( String script )
    {
       //     JSObject win = JSObject.getWindow(this);
             //win.eval( script );
    }
    
    public void doJs( String jscmd)
    {
        //String jscmd = "window.close()";  /* JavaScript command */
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
                downloadFilePriv(source, pathFix( target ) );
                return null;
            }
        });
        return true;
    }
     
    public boolean downloadFilePriv(String source, String target)
    {
        try
        {
            echoJs("Copy file to target: " + target );
            URL dl = new URL( source );
            ReadableByteChannel rbc = Channels.newChannel(dl.openStream());

            FileOutputStream fos = new FileOutputStream( target );
            fos.getChannel().transferFrom(rbc, 0, 1 << 24);
            //System.out.println(fos.getChannel().size());
            fos.close();
            rbc.close();

        }
        catch( MalformedURLException e )
        {
            echoJs("URL error 1 " + e.toString());
            return false;
        }
        catch( IOException e )
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
}
